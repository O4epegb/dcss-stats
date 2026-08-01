import { ChevronDoubleLeftIcon, ChevronDoubleRightIcon } from '@heroicons/react/24/outline'
import { Metadata } from 'next'
import Link from 'next/link'
import { fetchApi } from '~/api/server'
import { sharedOGMetadata } from '~/app/shared-metadata'
import { defaultMetaTitle } from '~/constants'
import { CombinedLeaderboardResponse, HighscoresLeaderboardResponse } from '~/types'
import { cn, formatNumber } from '~/utils'

const title = `Highscores Leaderboard | ${defaultMetaTitle}`

export const metadata: Metadata = {
  title,
  openGraph: {
    ...sharedOGMetadata,
    title,
  },
}

type SearchParams = {
  [key: string]: string | string[] | undefined
}

const kinds = [
  { value: 'combined', label: 'Combined' },
  { value: 'HIGHSCORE' as const, label: 'Score' },
  { value: 'TURN_COUNT' as const, label: 'Turncount' },
  { value: 'DURATION' as const, label: 'Speedrun' },
]

const runeTiersByKind: Record<string, { value?: string; label: string }[]> = {
  combined: [
    { value: undefined, label: 'Combined runes' },
    { value: 'TIER_1', label: 'Tier 1 runes' },
    { value: 'TIER_2', label: 'Tier 2 runes' },
  ],
  HIGHSCORE: [
    { value: undefined, label: 'Combined runes' },
    { value: 'TIER_1', label: '3 Runes' },
    { value: 'TIER_2', label: '4+ Runes' },
  ],
  TURN_COUNT: [
    { value: undefined, label: 'Combined runes' },
    { value: 'TIER_1', label: '3-14 Runes' },
    { value: 'TIER_2', label: '15 Runes' },
  ],
  DURATION: [
    { value: undefined, label: 'Combined runes' },
    { value: 'TIER_1', label: '3-14 Runes' },
    { value: 'TIER_2', label: '15 Runes' },
  ],
}

const PER_PAGE = 100

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const page = Number(params.page) || 1
  const skip = (page - 1) * PER_PAGE
  const search = params.search ? String(params.search) : ''
  const kind = (params.kind as string) ?? 'combined'
  const runeTier = params.runeTier as string | undefined

  const fetchParams = new URLSearchParams()
  fetchParams.append('kind', kind)
  if (runeTier) {
    fetchParams.append('runeTier', runeTier)
  }
  fetchParams.append('skip', String(skip))
  fetchParams.append('take', String(PER_PAGE))
  if (search) {
    fetchParams.append('search', search)
  }

  const response = await fetchApi('/highscores/leaderboard?' + fetchParams.toString()).then((r) =>
    r.json(),
  )

  const totalPages = Math.ceil(response.total / PER_PAGE)

  const paginationQuery = (pageNum: number) => ({
    pathname: '/highscores/leaderboard' as const,
    query: {
      kind: params.kind,
      runeTier: params.runeTier,
      search: params.search,
      page: pageNum > 1 ? String(pageNum) : undefined,
    },
  })

  const runeTiers = runeTiersByKind[kind] ?? runeTiersByKind.HIGHSCORE

  return (
    <div className="space-y-3">
      <p className="text-muted-foreground text-sm">
        Each character and rune tier has its own ranking. Place top 10 to earn points: 1st = 10 pts,
        2nd = 9 pts, down to 10th = 1 pt. Your total is the sum across all placements. E.g. ranking
        #1 on MiBe (3 runes) and #3 on GrFi (4+ runes) earns 10 + 8 = 18 points.
        <br />
        <span className="text-muted-foreground">
          Tier 1 runes - 3 runes for score, 3-14 runes for turncount and duration. Tier 2 runes - 4+
          runes for score, 15 runes for turncount and duration.
        </span>
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex gap-1">
          {kinds.map((k) => (
            <Link
              key={k.label}
              prefetch={false}
              href={{
                pathname: '/highscores/leaderboard',
                query: {
                  kind: k.value,
                  runeTier: k.value ? params.runeTier : undefined,
                  search: params.search,
                },
              }}
              className={cn(
                'rounded px-2 py-0.5 text-sm',
                kind === k.value || (k.value === undefined && !kind)
                  ? 'bg-surface-active font-medium'
                  : 'hover:bg-surface-hover',
              )}
            >
              {k.label}
            </Link>
          ))}
        </div>
        {runeTiers.length > 0 && (
          <>
            <span className="text-border-strong">|</span>
            <div className="flex gap-1">
              {runeTiers.map((r) => (
                <Link
                  key={r.label}
                  prefetch={false}
                  href={{
                    pathname: '/highscores/leaderboard',
                    query: {
                      kind: params.kind,
                      runeTier: r.value,
                      search: params.search,
                    },
                  }}
                  className={cn(
                    'rounded px-2 py-0.5 text-sm',
                    params.runeTier === r.value || (!params.runeTier && !r.value)
                      ? 'bg-surface-active font-medium'
                      : 'hover:bg-surface-hover',
                  )}
                >
                  {r.label}
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
      <form action="/highscores/leaderboard" method="get">
        <input type="hidden" name="kind" value={kind} />
        {runeTier && <input type="hidden" name="runeTier" value={runeTier} />}
        <input
          type="text"
          name="search"
          defaultValue={search}
          placeholder="Search player..."
          className="border-border bg-surface text-foreground placeholder:text-muted-foreground w-full rounded-sm border px-3 py-1.5 text-sm"
        />
      </form>

      {kind === 'combined' ? (
        <CombinedList data={response.data} />
      ) : (
        <SingleKindList data={response.data} kind={kind} />
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1 pt-2">
          {page > 2 && (
            <Link
              prefetch={false}
              href={paginationQuery(1)}
              className="hover:bg-surface-hover rounded px-2 py-1 text-sm"
            >
              <ChevronDoubleLeftIcon className="h-4 w-4" />
            </Link>
          )}
          {page > 1 && (
            <Link
              prefetch={false}
              href={paginationQuery(page - 1)}
              className="hover:bg-surface-hover rounded px-2 py-1 text-sm"
            >
              ← Prev
            </Link>
          )}
          <span className="text-muted-foreground px-2 text-sm">
            {page} / {totalPages}
          </span>
          {page < totalPages && (
            <Link
              prefetch={false}
              href={paginationQuery(page + 1)}
              className="hover:bg-surface-hover rounded px-2 py-1 text-sm"
            >
              Next →
            </Link>
          )}
          {page < totalPages - 1 && (
            <Link
              prefetch={false}
              href={paginationQuery(totalPages)}
              className="hover:bg-surface-hover rounded px-2 py-1 text-sm"
            >
              <ChevronDoubleRightIcon className="h-4 w-4" />
            </Link>
          )}
        </div>
      )}
    </div>
  )
}

const SingleKindList = ({
  data,
  kind,
}: {
  data: HighscoresLeaderboardResponse['data']
  kind: string
}) => {
  if (data.length === 0) {
    return <div className="text-muted-foreground py-4 text-center text-sm">No players found.</div>
  }

  return (
    <div className="divide-border divide-y overflow-hidden rounded-sm">
      {data.map((entry) => (
        <div
          key={entry.playerId}
          className="bg-surface text-foreground flex items-center gap-3 py-1 text-sm"
        >
          <span className="text-muted-foreground w-8 shrink-0 text-right font-mono">
            #{entry.rank}
          </span>
          <Link
            prefetch={false}
            href={`/players/${entry.playerName}`}
            className="font-medium hover:underline"
          >
            {entry.playerName}
          </Link>
          <div className="ml-auto flex shrink-0 flex-col items-end">
            <span className="font-mono font-medium">
              {formatNumber(entry.points)} <span className="text-muted-foreground">pts</span>
            </span>
            <Link
              prefetch={false}
              href={{ pathname: '/highscores', query: { player: entry.playerName, kind } }}
              className="text-muted-foreground hover:text-foreground text-xs hover:underline"
            >
              {entry.entryCount} {entry.entryCount === 1 ? 'entry' : 'entries'}
            </Link>
          </div>
        </div>
      ))}
    </div>
  )
}

const CombinedList = ({ data }: { data: CombinedLeaderboardResponse['data'] }) => {
  if (data.length === 0) {
    return <div className="text-muted-foreground py-4 text-center text-sm">No players found.</div>
  }

  return (
    <div className="divide-border divide-y overflow-hidden rounded-sm">
      {data.map((entry) => (
        <div
          key={entry.playerId}
          className="bg-surface text-foreground flex items-center gap-3 py-1 text-sm"
        >
          <span className="text-muted-foreground w-8 shrink-0 text-right font-mono">
            #{entry.rank}
          </span>
          <Link
            prefetch={false}
            href={`/players/${entry.playerName}`}
            className="font-medium hover:underline"
          >
            {entry.playerName}
          </Link>
          <div className="ml-auto flex shrink-0 items-center gap-4">
            <div className="flex shrink-0 flex-col gap-x-4 md:flex-row md:items-center">
              {entry.highscorePoints > 0 && (
                <span className="text-muted-foreground text-xs">
                  <span className="text-leaderboard-score">{entry.highscorePoints}</span> score
                </span>
              )}
              {entry.turncountPoints > 0 && (
                <span className="text-muted-foreground text-xs">
                  <span className="text-leaderboard-turncount">{entry.turncountPoints}</span> turns
                </span>
              )}
              {entry.durationPoints > 0 && (
                <span className="text-muted-foreground text-xs">
                  <span className="text-leaderboard-duration">{entry.durationPoints}</span> speed
                </span>
              )}
            </div>
            <span className="font-mono font-medium">
              {formatNumber(entry.totalPoints)} <span className="text-muted-foreground">pts</span>
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}
