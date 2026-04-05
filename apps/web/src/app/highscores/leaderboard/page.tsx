import { ChevronDoubleLeftIcon, ChevronDoubleRightIcon } from '@heroicons/react/24/outline'
import { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import { fetchApi } from '~/api/server'
import { sharedOGMetadata } from '~/app/shared-metadata'
import { HeaderWithMenu } from '~/components/HeaderWithMenu'
import { defaultMetaTitle } from '~/constants'
import { HighscoresLeaderboardResponse } from '~/types'
import { formatNumber } from '~/utils'

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
            View Highscores →
          </Link>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Points from top 10 placements in Char breakdown (both by 3 Runes and 4+ Runes). Each
          placement earns points: 1st place 10, 2nd place 9, and so on down to 10th place.
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

  const fetchParams = new URLSearchParams()
  fetchParams.append('skip', String(skip))
  fetchParams.append('take', String(PER_PAGE))
  if (search) {
    fetchParams.append('search', search)
  }

  const { data, total }: HighscoresLeaderboardResponse = await fetchApi(
    '/highscores/leaderboard?' + fetchParams.toString(),
  ).then((r) => r.json())

  const totalPages = Math.ceil(total / PER_PAGE)

  const paginationQuery = (pageNum: number) => ({
    pathname: '/highscores/leaderboard' as const,
    query: {
      ...(search ? { search } : {}),
      ...(pageNum > 1 ? { page: pageNum } : {}),
    },
  })

  return (
    <div className="space-y-3">
      <form action="/highscores/leaderboard" method="get">
        <input
          type="text"
          name="search"
          defaultValue={search}
          placeholder="Search player..."
          className="w-full rounded-sm border border-gray-200 bg-white px-3 py-1.5 text-sm text-black placeholder-gray-400 dark:border-gray-300 dark:bg-zinc-900 dark:text-white dark:placeholder-gray-500"
        />
      </form>

      {data.length === 0 && (
        <div className="py-4 text-center text-sm text-gray-500 dark:text-gray-400">
          No players found.
        </div>
      )}

      {data.length > 0 && (
        <div className="space-y-0.5">
          {data.map((entry) => (
            <div
              key={entry.playerId}
              className="flex items-center gap-3 rounded-sm border border-gray-200 bg-white px-3 py-1 text-sm text-black dark:border-gray-300 dark:bg-zinc-900 dark:text-white"
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
                  href={{ pathname: '/highscores', query: { player: entry.playerName } }}
                  className="text-xs text-gray-500 hover:text-gray-700 hover:underline dark:text-gray-400 dark:hover:text-gray-200"
                >
                  {entry.entryCount} {entry.entryCount === 1 ? 'entry' : 'entries'}
                </Link>
              </div>
            </div>
          ))}
        </div>
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

export default LeaderboardPage
