import dayjs from 'dayjs'
import utcPlugin from 'dayjs/plugin/utc'
import { RouteHandlerMethod } from 'fastify'
import { orderBy } from 'lodash-es'
import { AppType } from '~/app/app'
import { createCache } from '~/app/cache'
import { fetchCoffeeSupporters } from './buymeacoffee'
import { createCachedSupportersLoader } from './cache'
import { fetchGitHubSupporters } from './github'
import { Donation, SupportersData } from './types'

dayjs.extend(utcPlugin)

const emptyData: SupportersData = { oneTimeDonations: [], subscriptionDonations: [] }

const manualDonations: Donation[] = [
  {
    id: 'kofi-1',
    type: 'one-time',
    amount: 50,
    currency: 'USD',
    createdAt: '2025-05-20T00:00:00.000Z',
    source: 'kofi',
  },
  {
    id: 'bitcoin-1',
    type: 'one-time',
    amount: 20,
    currency: 'USD',
    createdAt: '2026-04-05T00:00:00.000Z',
    source: 'bitcoin',
  },
]

export const supportersRoute = (
  app: AppType,
  { cache = createCache() }: { cache?: ReturnType<typeof createCache> } = {},
) => {
  const coffeeToken = process.env.BUYMEACOFFEE_TOKEN
  const githubToken = process.env.GITHUB_SPONSORS_TOKEN
  const getCoffeeData = coffeeToken
    ? createCachedSupportersLoader(cache, 'supporters:buymeacoffee', () =>
        fetchCoffeeSupporters(coffeeToken),
      )
    : async () => emptyData
  const getGitHubData = githubToken
    ? createCachedSupportersLoader(cache, 'supporters:github', () =>
        fetchGitHubSupporters(githubToken),
      )
    : async () => emptyData

  const getData = async (): Promise<SupportersData | undefined> => {
    if (!coffeeToken && !githubToken) return undefined

    const [coffee, github] = await Promise.all([
      getCoffeeData(),
      getGitHubData().catch(() => {
        if (coffeeToken) return emptyData
        throw new Error('GitHub Sponsors data is unavailable')
      }),
    ])

    return {
      oneTimeDonations: orderBy(
        [...coffee.oneTimeDonations, ...github.oneTimeDonations, ...manualDonations],
        [(donation) => dayjs(donation.createdAt).valueOf()],
        ['desc'],
      ),
      subscriptionDonations: [...coffee.subscriptionDonations, ...github.subscriptionDonations],
    }
  }

  const handleSupporters = (select: (data: SupportersData) => unknown): RouteHandlerMethod => {
    return async (_request, reply) => {
      try {
        const data = await getData()
        if (!data) return reply.status(404).send('Token ENV is not set')
        return select(data)
      } catch (error) {
        return reply.status(500).send({
          error: error instanceof Error ? error.message : 'Supporters fetch failed',
        })
      }
    }
  }

  app.get('/api/supporters/current', handleSupporters(getMonthlySupport))
  app.get(
    '/api/supporters',
    handleSupporters((data) => data),
  )
}

function getMonthlySupport(data: SupportersData) {
  const totalFromSupporters = data.oneTimeDonations
    .filter((donation) => dayjs(donation.createdAt).isAfter(dayjs().subtract(1, 'month')))
    .reduce((total, donation) => total + donation.amount, 0)
  const perMonthFromSubscriptions = data.subscriptionDonations.reduce((total, donation) => {
    if (donation.source === 'github') return total + donation.amount

    // UTC avoids rounding a monthly period down to zero across DST changes.
    const months = dayjs
      .utc(donation.currentPeriodEnd)
      .diff(dayjs.utc(donation.currentPeriodStart), 'month')
    return total + donation.amount / months
  }, 0)

  return {
    total: Math.round((totalFromSupporters + perMonthFromSubscriptions) * 100) / 100,
    goal: 20,
  }
}
