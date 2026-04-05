import { ArrowTopRightOnSquareIcon } from '@heroicons/react/16/solid'
import { ChevronDoubleLeftIcon, ChevronDoubleRightIcon } from '@heroicons/react/24/outline'
import { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import { fetchApi } from '~/api/server'
import { sharedOGMetadata } from '~/app/shared-metadata'
import { HeaderWithMenu } from '~/components/HeaderWithMenu'
import { defaultMetaTitle } from '~/constants'
import { HighscoresResponse } from '~/types'
import { cn, date, formatDuration, formatNumber, getMorgueUrl, pluralize } from '~/utils'

const title = `Highscores | ${defaultMetaTitle}`

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

const runeTiers = [
  { value: undefined, label: 'All runes' },
  { value: 'THREE_RUNES', label: '3 Runes' },
  { value: 'FOUR_PLUS_RUNES', label: '4+ Runes' },
]

const PER_PAGE = 100

const HighscoresPage = ({ searchParams }: { searchParams: Promise<SearchParams> }) => {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col items-center space-y-8 p-4">
      <HeaderWithMenu />

      <div className="w-full max-w-5xl space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-medium">Highscores</h2>
          <Link
            prefetch={false}
            href="/highscores/leaderboard"
            className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            Leaderboard →
          </Link>
        </div>
        <Suspense
          fallback={
            <div className="space-y-2">
              {[...Array(10)].map((_, i) => (
                <div
                  key={i}
                  className="h-14 w-full animate-pulse rounded-sm bg-gray-200 dark:bg-gray-700"
                />
              ))}
            </div>
          }
        >
          <HighscoresList searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  )
}

const HighscoresList = async ({ searchParams }: { searchParams: Promise<SearchParams> }) => {
  const params = await searchParams

  return <HighscoresListCached searchParams={params} />
}

const HighscoresListCached = async ({ searchParams }: { searchParams: SearchParams }) => {
  const page = Number(searchParams.page) || 1
  const skip = (page - 1) * PER_PAGE

  const fetchParams = new URLSearchParams()
  fetchParams.append('breakdown', String(searchParams.breakdown ?? 'CHAR'))
  fetchParams.append('runeTier', String(searchParams.runeTier ?? 'ALL'))
  if (searchParams.player) {
    fetchParams.append('player', String(searchParams.player))
  }
  fetchParams.append('skip', String(skip))
  fetchParams.append('take', String(PER_PAGE))

  const { data, total }: HighscoresResponse = await fetchApi(
    '/highscores?' + fetchParams.toString(),
  ).then((r) => r.json())

  const totalPages = Math.ceil(total / PER_PAGE)

  const paginationQuery = (pageNum: number) => ({
    pathname: '/highscores' as const,
    query: {
      ...(searchParams.breakdown ? { breakdown: searchParams.breakdown } : {}),
      ...(searchParams.runeTier ? { runeTier: searchParams.runeTier } : {}),
      ...(searchParams.player ? { player: searchParams.player } : {}),
      ...(pageNum > 1 ? { page: pageNum } : {}),
    },
  })

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            {runeTiers.map((r) => (
              <Link
                key={r.label}
                prefetch={false}
                href={{
                  pathname: '/highscores',
                  query: {
                    ...(r.value ? { runeTier: r.value } : {}),
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
        </div>

        {data.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-8 text-center text-gray-500 dark:text-gray-400">
            <span className="text-xl">¯\_(ツ)_/¯</span>
            <div>No highscores found.</div>
          </div>
        )}

        {data.length > 0 && (
          <div className="space-y-0.5">
            {data.map((entry, index) => {
              const game = entry.game

              return (
                <div
                  key={`${entry.gameId}-${entry.breakdown}-${entry.runeTier}`}
                  className="flex gap-3 rounded-sm border border-gray-200 bg-white px-3 py-2 text-sm text-black dark:border-gray-300 dark:bg-zinc-900 dark:text-white"
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-medium">
                      <span className="mr-1.5 shrink-0 font-mono text-gray-500 dark:text-gray-400">
                        {skip + index + 1}.
                      </span>
                      <Link
                        prefetch={false}
                        href={`/players/${entry.player.name}`}
                        className="hover:underline"
                      >
                        {entry.player.name}
                      </Link>
                    </div>
                    {searchParams.player && (
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        #{entry.rank} in {entry.breakdown.toLowerCase()} breakdown
                      </div>
                    )}
                    <div>
                      {entry.char}
                      {game.god && <span className="font-light"> of {game.god}</span>},{' '}
                      <span className={game.isWin ? 'text-emerald-500' : 'text-red-500'}>
                        {game.isWin ? 'escaped' : game.endMessage}
                      </span>
                      {!game.isWin && game.lvl > 0 && (
                        <span>
                          {' '}
                          in {game.branch}:{game.lvl}
                        </span>
                      )}
                      {game.uniqueRunes > 0 && (
                        <span className="text-indigo-600 dark:text-indigo-400">
                          {' '}
                          {game.isWin ? 'and' : 'with'} {game.uniqueRunes}{' '}
                          {pluralize('rune', game.uniqueRunes)}
                        </span>
                      )}
                      {game.gems > 0 && (
                        <span className="text-indigo-600 dark:text-indigo-400">
                          {' '}
                          {game.uniqueRunes === 0 ? 'with' : 'and'} {game.gems}{' '}
                          {pluralize('gem', game.gems)}
                        </span>
                      )}
                      {(game.uniqueRunes > 0 || game.gems > 0) && '!'}
                    </div>
                    <div className="flex flex-wrap gap-x-2 text-xs text-gray-500 dark:text-gray-400">
                      <span>XL:{game.xl}</span>
                      <span>{formatNumber(game.turns)} turns</span>
                      <span>{formatDuration(game.duration)}</span>
                      <span>{date(game.endAt).utc().format('DD MMM YYYY')}</span>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col items-end justify-between">
                    <span className="font-mono font-medium">{formatNumber(entry.score)}</span>
                    {game.server && (
                      <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                        <a
                          target="_blank"
                          rel="noopener noreferrer"
                          href={game.server.url}
                          title={game.server.name}
                          className="underline"
                        >
                          {game.server.abbreviation}
                        </a>
                        <a
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Morgue"
                          href={getMorgueUrl(game.server.morgueUrl, game)}
                          className="hover:text-gray-700 dark:hover:text-gray-300"
                        >
                          <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5" />
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-1 pt-4">
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
    </>
  )
}

export default HighscoresPage
