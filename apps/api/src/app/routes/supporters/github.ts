import axios from 'axios'
import { Static, TSchema, Type } from 'typebox'
import { Value } from 'typebox/value'
import { Donation, SupportersData } from './types'

const tierSchema = Type.Object({
  isOneTime: Type.Boolean(),
  monthlyPriceInCents: Type.Integer({ minimum: 0 }),
})

const sponsorshipSchema = Type.Object({
  id: Type.String({ minLength: 1 }),
  createdAt: Type.String(),
  isActive: Type.Boolean(),
  isOneTimePayment: Type.Boolean(),
  tier: Type.Union([tierSchema, Type.Null()]),
})

const activitySchema = Type.Object({
  id: Type.String({ minLength: 1 }),
  createdAt: Type.Union([Type.String(), Type.Null()]),
  tier: Type.Union([tierSchema, Type.Null()]),
})

const sponsorshipsQuery = `query GitHubSponsorships($after: String) {
  viewer {
    donations: sponsorshipsAsMaintainer(
      first: 100, after: $after, activeOnly: true, includePrivate: true,
      orderBy: { field: CREATED_AT, direction: ASC }
    ) {
      nodes { id createdAt isActive isOneTimePayment tier { isOneTime monthlyPriceInCents } }
      pageInfo { hasNextPage endCursor }
    }
  }
}`

const activitiesQuery = `query GitHubSponsorActivities($after: String) {
  viewer {
    donations: sponsorsActivities(
      first: 100, after: $after, period: ALL, includePrivate: true,
      includeAsSponsor: false, actions: [NEW_SPONSORSHIP],
      orderBy: { field: TIMESTAMP, direction: DESC }
    ) {
      nodes { id createdAt: timestamp tier: sponsorsTier { isOneTime monthlyPriceInCents } }
      pageInfo { hasNextPage endCursor }
    }
  }
}`

async function fetchPages<T extends TSchema>(token: string, query: string, nodeSchema: T) {
  const responseSchema = Type.Object({
    data: Type.Object({
      viewer: Type.Object({
        donations: Type.Object({
          nodes: Type.Array(nodeSchema),
          pageInfo: Type.Object({
            hasNextPage: Type.Boolean(),
            endCursor: Type.Union([Type.String(), Type.Null()]),
          }),
        }),
      }),
    }),
    errors: Type.Optional(Type.Array(Type.Unknown())),
  })
  const nodes: Static<T>[] = []
  const cursors = new Set<string>()
  let after: string | null = null

  // Fail rather than silently truncating history or following a broken cursor forever.
  for (let page = 0; page < 100; page++) {
    let data: unknown
    try {
      const response = await axios.post<unknown>(
        'https://api.github.com/graphql',
        { query, variables: { after } },
        { headers: { Authorization: `Bearer ${token}` }, timeout: 15_000, maxRedirects: 0 },
      )
      data = response.data
    } catch {
      // Axios errors contain request headers, including the token. Never forward them.
      throw new Error('GitHub Sponsors request failed')
    }

    if (!Value.Check(responseSchema, data) || data.errors?.length) {
      throw new Error('GitHub Sponsors returned an incomplete or invalid response')
    }

    const connection = data.data.viewer.donations
    nodes.push(...connection.nodes)
    if (!connection.pageInfo.hasNextPage) return nodes

    const cursor = connection.pageInfo.endCursor
    if (!cursor || cursors.has(cursor)) {
      throw new Error('GitHub Sponsors returned an invalid pagination cursor')
    }
    cursors.add(cursor)
    after = cursor
  }

  throw new Error('GitHub Sponsors exceeded the pagination limit')
}

function donationFields(id: string, createdAt: string | null, amountInCents: number) {
  if (!createdAt || !Number.isFinite(Date.parse(createdAt))) {
    throw new Error('GitHub Sponsors returned an invalid donation date')
  }
  return {
    id: `github-${id}`,
    source: 'github' as const,
    currency: 'USD',
    amount: amountInCents / 100,
    createdAt: new Date(createdAt).toISOString(),
  }
}

export async function fetchGitHubSupporters(token: string): Promise<SupportersData> {
  const [sponsorships, activities] = await Promise.all([
    fetchPages(token, sponsorshipsQuery, sponsorshipSchema),
    fetchPages(token, activitiesQuery, activitySchema),
  ])
  const subscriptionDonations = new Map<string, Donation>()
  const oneTimeDonations = new Map<string, Donation>()

  for (const sponsorship of sponsorships) {
    // GitHub also marks recent one-time sponsorships as active.
    if (!sponsorship.isActive || sponsorship.isOneTimePayment) continue
    if (!sponsorship.tier || sponsorship.tier.isOneTime) {
      throw new Error('GitHub Sponsors returned an unavailable recurring tier')
    }
    subscriptionDonations.set(sponsorship.id, {
      ...donationFields(
        sponsorship.id,
        sponsorship.createdAt,
        sponsorship.tier.monthlyPriceInCents,
      ),
      type: 'subscription',
      durationType: 'monthly',
      isActiveNow: true,
    })
  }

  for (const activity of activities) {
    if (!activity.tier) {
      throw new Error('GitHub Sponsors returned an unavailable activity tier')
    }
    if (!activity.tier.isOneTime) continue
    oneTimeDonations.set(activity.id, {
      ...donationFields(activity.id, activity.createdAt, activity.tier.monthlyPriceInCents),
      type: 'one-time',
    })
  }

  return {
    oneTimeDonations: [...oneTimeDonations.values()],
    subscriptionDonations: [...subscriptionDonations.values()],
  }
}
