import clsx from 'clsx'
import { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import { fetchApi } from '~/api/server'
import { sharedOGMetadata } from '~/app/shared-metadata'
import { Logo } from '~/components/Logo'
import { ThemeSelector } from '~/components/ThemeSelector'
import { defaultMetaTitle } from '~/constants'
import { Streak } from '~/types'
import { cn, date } from '~/utils'

// Ideas for streaks data tab:
// Most streakable players (total combined length or average length)
// Most streakable combo/race/class
// Most streaks broken by X
// Filters: min length, max length, date range

const title = `Streaks | ${defaultMetaTitle}`

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

const StreaksPage = ({ searchParams }: { searchParams: Promise<SearchParams> }) => {
  return (
    <div className="container mx-auto flex min-h-screen flex-col items-center space-y-4 px-4 py-4 pt-4">
      <header className="flex w-full max-w-lg items-center gap-4">
        <Logo />
        <ThemeSelector className="ml-auto" />
      </header>

      <div className="w-full max-w-lg space-y-2">
        <h2 className="text-xl font-medium">Streaks overview</h2>
        <Suspense
          fallback={
            <div className="space-y-2">
              {[...Array(10)].map((_, i) => (
                <div
                  key={i}
                  className="h-40 w-full animate-pulse rounded-sm bg-gray-200 dark:bg-gray-700"
                />
              ))}
            </div>
          }
        >
          <StreaksList searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  )
}

const StreaksList = async ({ searchParams }: { searchParams: Promise<SearchParams> }) => {
  const params = await searchParams

  return <StreaksListCached searchParams={params} />
}

const StreaksListCached = async ({ searchParams }: { searchParams: SearchParams }) => {
  'use cache'

  const fetchParams = new URLSearchParams()
  if (searchParams.type) {
    fetchParams.append('type', String(searchParams.type).toUpperCase())
  }
  if (searchParams.isBroken) {
    fetchParams.append('isBroken', String(searchParams.isBroken))
  }

  const { data }: { data: Streak[] } = await fetchApi(
    '/streaks' + (fetchParams.size ? `?${fetchParams.toString()}` : ''),
  ).then((r) => r.json())

  return (
    <>
      <div className="space-y-2">
        <div className="space-y-2">
          <div className="space-x-4">
            <Link
              prefetch={false}
              href={{
                pathname: '/streaks',
                query: { type: undefined, isBroken: searchParams.isBroken },
              }}
              className={cn(searchParams.type === undefined && 'underline')}
            >
              All Types
            </Link>
            <Link
              prefetch={false}
              href={{
                pathname: '/streaks',
                query: { type: 'mixed', isBroken: searchParams.isBroken },
              }}
              className={cn(searchParams.type === 'mixed' && 'underline')}
            >
              Mixed
            </Link>
            <Link
              prefetch={false}
              href={{
                pathname: '/streaks',
                query: { type: 'unique', isBroken: searchParams.isBroken },
              }}
              className={cn(searchParams.type === 'unique' && 'underline')}
            >
              Unique
            </Link>
            <Link
              prefetch={false}
              href={{
                pathname: '/streaks',
                query: { type: 'mono', isBroken: searchParams.isBroken },
              }}
              className={cn(searchParams.type === 'mono' && 'underline')}
            >
              Mono
            </Link>
          </div>
          <div className="space-x-4">
            <Link
              prefetch={false}
              href={{
                pathname: '/streaks',
                query: { type: searchParams.type, isBroken: undefined },
              }}
              className={cn(searchParams.isBroken === undefined && 'underline')}
            >
              All Statuses
            </Link>
            <Link
              prefetch={false}
              href={{ pathname: '/streaks', query: { type: searchParams.type, isBroken: 'false' } }}
              className={cn(searchParams.isBroken === 'false' && 'underline')}
            >
              Ongoing
            </Link>
            <Link
              prefetch={false}
              href={{ pathname: '/streaks', query: { type: searchParams.type, isBroken: 'true' } }}
              className={cn(searchParams.isBroken === 'true' && 'underline')}
            >
              Broken
            </Link>
          </div>
        </div>
        {data.length === 0 && (
          <div className="flex flex-col items-center gap-2 text-center text-gray-500 dark:text-gray-400">
            <span className="text-xl">¯\_(ツ)_/¯</span>
            <div>No streaks found with the specified filters.</div>
          </div>
        )}
        {data.map((streak, index) => (
          <div
            key={streak.id}
            className={clsx(
              'flex flex-col gap-2 rounded-sm border border-gray-200 bg-white p-3 text-sm text-black dark:border-gray-300 dark:bg-zinc-900 dark:text-white',
              !streak.isBroken && 'border-l-2 border-l-emerald-500 dark:border-l-emerald-400',
            )}
          >
            <div className="flex items-start justify-between gap-1">
              <div className="flex flex-wrap items-center gap-1 md:gap-2">
                <div>
                  <span className="font-mono leading-none text-gray-500 dark:text-gray-400">
                    {index + 1}.
                  </span>
                  <Link
                    prefetch={false}
                    href={`/players/${streak.player.name}`}
                    className="font-bold hover:underline"
                  >
                    {streak.player.name}
                  </Link>
                </div>
                <span className="text-xs whitespace-nowrap text-gray-500 dark:text-gray-400">
                  {date(streak.startedAt).format('LL')}
                  {streak.endedAt ? (
                    ` - ${date(streak.endedAt).format('LL')}`
                  ) : (
                    <>
                      {' '}
                      - <span className="text-emerald-600 dark:text-emerald-400">Ongoing</span>
                    </>
                  )}
                </span>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {streak.type !== 'MIXED' && (
                  <span
                    className={cn('rounded px-1.5 py-0.5 text-xs font-medium', {
                      'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200':
                        streak.type === 'UNIQUE',
                      'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200':
                        streak.type === 'MONO',
                    })}
                  >
                    {streak.type.slice(0, 1).toUpperCase() + streak.type.slice(1).toLowerCase()}
                  </span>
                )}
                <div className="font-mono text-lg leading-none font-bold">{streak.length}</div>
              </div>
            </div>

            <div className="flex flex-wrap gap-1">
              {streak.games.map(({ gameId, game }) => (
                <span
                  key={gameId}
                  className={cn(
                    'text-2xs rounded px-1.5 py-0.5 font-mono font-medium md:text-xs',
                    game.isWin
                      ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-50'
                      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100',
                  )}
                  title={game.char}
                >
                  {game.char}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

export default StreaksPage
