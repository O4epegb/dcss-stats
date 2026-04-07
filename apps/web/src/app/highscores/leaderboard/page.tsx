import { ChevronDoubleLeftIcon, ChevronDoubleRightIcon } from '@heroicons/react/24/outline'
import { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import { fetchApi } from '~/api/server'
import { sharedOGMetadata } from '~/app/shared-metadata'
import { HeaderWithMenu } from '~/components/HeaderWithMenu'
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

const LeaderboardPage = ({ searchParams }: { searchParams: Promise<SearchParams> }) => {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col items-center space-y-8 p-4">
      <HeaderWithMenu />

      <div className="w-full max-w-5xl space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-medium">Highscores Leaderboard</h2>
          <Link
            prefetch={false}
            href="/highscores"
            className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            Highscores →
          </Link>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Each character and rune tier has its own ranking. Place top 10 to earn points: 1st = 10
          pts, 2nd = 9 pts, down to 10th = 1 pt. Your total is the sum across all placements. E.g.
          ranking #1 on MiBe (3 runes) and #3 on GrFi (4+ runes) earns 10 + 8 = 18 points.
          <br />
          <span className="text-gray-400 dark:text-gray-500">
            Tier 1 runes - 3 runes for score, 3-14 runes for turncount and duration. Tier 2 runes -
            4+ runes for score, 15 runes for turncount and duration.
          </span>
        </p>
        <Suspense
          fallback={
            <div className="space-y-2">
              {[...Array(20)].map((_, i) => (
                <div
                  key={i}
                  className="h-10 w-full animate-pulse rounded-sm bg-gray-200 dark:bg-gray-700"
                />
              ))}
            </div>
          }
        >
          <LeaderboardList searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  )
}

const LeaderboardList = async ({ searchParams }: { searchParams: Promise<SearchParams> }) => {
  const params = await searchParams

  return <LeaderboardListCached searchParams={params} />
}

const LeaderboardListCached = async ({ searchParams }: { searchParams: SearchParams }) => {
  const page = Number(searchParams.page) || 1
  const skip = (page - 1) * PER_PAGE
  const search = searchParams.search ? String(searchParams.search) : ''
  const kind = (searchParams.kind as string) ?? 'combined'
  const runeTier = searchParams.runeTier as string | undefined

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
      kind: searchParams.kind,
      runeTier: searchParams.runeTier,
      search: searchParams.search,
      page: pageNum > 1 ? String(pageNum) : undefined,
    },
  })

  const runeTiers = runeTiersByKind[kind] ?? runeTiersByKind.HIGHSCORE

  return (
    <div className="space-y-3">
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
                  runeTier: k.value ? searchParams.runeTier : undefined,
                  search: searchParams.search,
                },
              }}
              className={cn(
                'rounded px-2 py-0.5 text-sm',
                kind === k.value || (k.value === undefined && !kind)
                  ? 'bg-gray-200 font-medium dark:bg-gray-700'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-800',
              )}
            >
              {k.label}
            </Link>
          ))}
        </div>
        {runeTiers.length > 0 && (
          <>
            <span className="text-gray-300 dark:text-gray-600">|</span>
            <div className="flex gap-1">
              {runeTiers.map((r) => (
                <Link
                  key={r.label}
                  prefetch={false}
                  href={{
                    pathname: '/highscores/leaderboard',
                    query: {
                      kind: searchParams.kind,
                      runeTier: r.value,
                      search: searchParams.search,
                    },
                  }}
                  className={cn(
                    'rounded px-2 py-0.5 text-sm',
                    searchParams.runeTier === r.value || (!searchParams.runeTier && !r.value)
                      ? 'bg-gray-200 font-medium dark:bg-gray-700'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-800',
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
          className="w-full rounded-sm border border-gray-200 bg-white px-3 py-1.5 text-sm text-black placeholder-gray-400 dark:border-gray-300 dark:bg-zinc-900 dark:text-white dark:placeholder-gray-500"
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
              className="rounded px-2 py-1 text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <ChevronDoubleLeftIcon className="h-4 w-4" />
            </Link>
          )}
          {page > 1 && (
            <Link
              prefetch={false}
              href={paginationQuery(page - 1)}
              className="rounded px-2 py-1 text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              ← Prev
            </Link>
          )}
          <span className="px-2 text-sm text-gray-500 dark:text-gray-400">
            {page} / {totalPages}
          </span>
          {page < totalPages && (
            <Link
              prefetch={false}
              href={paginationQuery(page + 1)}
              className="rounded px-2 py-1 text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              Next →
            </Link>
          )}
          {page < totalPages - 1 && (
            <Link
              prefetch={false}
              href={paginationQuery(totalPages)}
              className="rounded px-2 py-1 text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
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
    return (
      <div className="py-4 text-center text-sm text-gray-500 dark:text-gray-400">
        No players found.
      </div>
    )
  }

  return (
    <div className="divide-y divide-gray-200 overflow-hidden rounded-sm dark:divide-gray-700">
      {data.map((entry) => (
        <div
          key={entry.playerId}
          className="flex items-center gap-3 bg-white py-1 text-sm text-black dark:bg-zinc-900 dark:text-white"
        >
          <span className="w-8 shrink-0 text-right font-mono text-gray-500 dark:text-gray-400">
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
              {formatNumber(entry.points)}{' '}
              <span className="text-gray-500 dark:text-gray-400">pts</span>
            </span>
            <Link
              prefetch={false}
              href={{ pathname: '/highscores', query: { player: entry.playerName, kind } }}
              className="text-xs text-gray-500 hover:text-gray-700 hover:underline dark:text-gray-400 dark:hover:text-gray-200"
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
    return (
      <div className="py-4 text-center text-sm text-gray-500 dark:text-gray-400">
        No players found.
      </div>
    )
  }

  return (
    <div className="divide-y divide-gray-200 overflow-hidden rounded-sm dark:divide-gray-700">
      {data.map((entry) => (
        <div
          key={entry.playerId}
          className="flex items-center gap-3 bg-white py-1 text-sm text-black dark:bg-zinc-900 dark:text-white"
        >
          <span className="w-8 shrink-0 text-right font-mono text-gray-500 dark:text-gray-400">
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
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  <span className="text-teal-500">{entry.highscorePoints}</span> score
                </span>
              )}
              {entry.turncountPoints > 0 && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  <span className="text-cyan-500">{entry.turncountPoints}</span> turns
                </span>
              )}
              {entry.durationPoints > 0 && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  <span className="text-violet-500">{entry.durationPoints}</span> speed
                </span>
              )}
            </div>
            <span className="font-mono font-medium">
              {formatNumber(entry.totalPoints)}{' '}
              <span className="text-gray-500 dark:text-gray-400">pts</span>
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}

export default LeaderboardPage
