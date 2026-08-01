import { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import { fetchApi } from '~/api/server'
import { sharedOGMetadata } from '~/app/shared-metadata'
import { HeaderWithMenu } from '~/components/HeaderWithMenu'
import { defaultMetaTitle } from '~/constants'
import { Streak } from '~/types'
import { cn, date } from '~/utils'

// Ideas for streaks data tab:
// Most streakable players (total combined length or average length)
// Most streakable char/race/class
// Most streaks broken by char/race/class
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
    <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col items-center space-y-8 p-4">
      <HeaderWithMenu />

      <div className="w-full max-w-5xl space-y-2">
        <h2 className="text-page-heading text-xl font-medium">Streaks overview</h2>
        <Suspense
          fallback={
            <div className="space-y-2">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="bg-surface-active h-40 w-full animate-pulse rounded-sm" />
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
          <div className="text-muted-foreground flex flex-col items-center gap-2 text-center">
            <span className="text-xl">¯\_(ツ)_/¯</span>
            <div>No streaks found with the specified filters.</div>
          </div>
        )}
        {data.map((streak, index) => (
          <div
            key={streak.id}
            className={cn(
              'border-border bg-surface text-foreground flex flex-col gap-2 rounded-sm border p-3 text-sm',
              !streak.isBroken && 'border-l-success border-l-2',
            )}
          >
            <div className="flex items-start justify-between gap-1">
              <div className="flex flex-wrap items-center gap-1 md:gap-2">
                <div>
                  <span className="text-muted-foreground font-mono leading-none">{index + 1}.</span>
                  <Link
                    prefetch={false}
                    href={`/players/${streak.player.name}`}
                    className="font-bold hover:underline"
                  >
                    {streak.player.name}
                  </Link>
                </div>
                <span className="text-muted-foreground text-xs whitespace-nowrap">
                  {date(streak.startedAt).format('LL')}
                  {streak.endedAt ? (
                    ` - ${date(streak.endedAt).format('LL')}`
                  ) : (
                    <>
                      {' '}
                      - <span className="text-success">Ongoing</span>
                    </>
                  )}
                </span>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {streak.type !== 'MIXED' && (
                  <span
                    className={cn('rounded px-1.5 py-0.5 text-xs font-medium', {
                      'bg-warning-surface text-warning-foreground': streak.type === 'UNIQUE',
                      'bg-special-surface text-special-foreground': streak.type === 'MONO',
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
                      ? 'bg-success-surface text-success-foreground'
                      : 'bg-danger-surface text-danger-foreground',
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
