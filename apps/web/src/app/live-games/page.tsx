import { Metadata } from 'next'
import { cacheLife } from 'next/cache'
import { fetchApi } from '~/api/server'
import { sharedOGMetadata } from '~/app/shared-metadata'
import { Logo } from '~/components/Logo'
import { ThemeSelector } from '~/components/ThemeSelector'
import { defaultMetaTitle } from '~/constants'
import { LiveGamesResponse, LiveGamesTable, getVersionFromGameId } from '~/screens/main/LiveGames'
import { cn, formatNumber } from '~/utils'

const title = `Live games | ${defaultMetaTitle}`

export const metadata: Metadata = {
  title,
  openGraph: {
    ...sharedOGMetadata,
    title,
  },
}

type GroupedStatsItem = {
  label: string
  count: number
}

const groupAndSort = (labels: string[]): GroupedStatsItem[] => {
  const statsMap = labels.reduce<Map<string, number>>((acc, label) => {
    acc.set(label, (acc.get(label) || 0) + 1)
    return acc
  }, new Map())

  return Array.from(statsMap.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => {
      if (b.count !== a.count) {
        return b.count - a.count
      }

      return b.label.localeCompare(a.label, undefined, { numeric: true })
    })
}

const StatsList = ({ className, items }: { className?: string; items: GroupedStatsItem[] }) => {
  return (
    <section
      className={cn('space-y-2 border-b border-gray-200 pb-1 dark:border-zinc-700', className)}
    >
      <ul className="flex flex-wrap gap-1">
        {items.map(({ label, count }) => (
          <li
            key={label}
            className="rounded bg-gray-100 px-1 py-0.5 text-xs font-medium text-gray-700 dark:bg-zinc-800 dark:text-zinc-200"
          >
            {label} ({formatNumber(count)})
          </li>
        ))}
        <li className="flex items-center justify-center text-xs">{items.length} distinct</li>
      </ul>
    </section>
  )
}

const xlLevels = Array.from({ length: 27 }, (_, index) => index + 1)

export default async function LiveGamesPage() {
  'use cache'

  cacheLife({
    stale: 20,
    revalidate: 30,
    expire: 120,
  })

  const response: LiveGamesResponse = await fetchApi(`/live-games`).then((r) => r.json())
  const { games } = response.data
  const gamesByVersion = groupAndSort(games.map((game) => getVersionFromGameId(game.game_id)))
  const gamesByGod = groupAndSort(
    games.filter((game) => game.xl).map((game) => game.god?.trim() || 'No god'),
  )
  const gamesByRace = groupAndSort(
    games.filter((game) => game.char).map((game) => game.char?.slice(0, 2) || 'Unknown'),
  )
  const gamesByChar = groupAndSort(
    games.filter((game) => game.char).map((game) => game.char || 'Unknown'),
  )
  const gamesByClass = groupAndSort(
    games.filter((game) => game.char).map((game) => game.char?.slice(2) || 'Unknown'),
  )
  const gamesByXlMap = games.reduce<Map<number, number>>((acc, game) => {
    const xl = game.xl

    if (xl === null || xl < 1 || xl > 27) {
      return acc
    }

    acc.set(xl, (acc.get(xl) || 0) + 1)
    return acc
  }, new Map())
  const gamesByXl = xlLevels.map((xl) => ({ xl, count: gamesByXlMap.get(xl) || 0 }))
  const maxXlCount = Math.max(...gamesByXl.map((item) => item.count), 1)

  if (games.length === 0) {
    return null
  }

  return (
    <div className="container mx-auto flex min-h-dvh flex-col items-center px-4">
      <div className="w-full max-w-6xl space-y-2 py-4">
        <header className="mx-auto flex w-full items-center gap-4">
          <Logo />
          <div className="ml-auto">
            <ThemeSelector />
          </div>
        </header>

        <div className="grid gap-2">
          <h2 className="font-semibold">{games.length} live games</h2>
          <StatsList className="border-none" items={gamesByVersion} />
          <details className="min-w-0 space-y-1">
            <summary>More stats</summary>
            <StatsList items={gamesByGod} />
            <StatsList items={gamesByRace} />
            <StatsList items={gamesByClass} />
            <StatsList items={gamesByChar} />
            <section className="min-w-0 space-y-2 rounded border-gray-200 dark:border-zinc-700">
              <div className="flex h-37 items-end gap-1 overflow-x-auto">
                {gamesByXl.map(({ xl, count }) => {
                  const height = `${(count / maxXlCount) * 100}%`

                  return (
                    <div
                      key={xl}
                      className="flex min-w-4 flex-1 flex-col items-center justify-end gap-1"
                    >
                      <div className="relative flex h-28 w-full items-end rounded bg-gray-100 dark:bg-zinc-800">
                        <div
                          className="relative w-full rounded bg-gray-400 dark:bg-zinc-500"
                          style={{ height }}
                        >
                          <div className="text-2xs absolute -top-4 right-0 left-0 text-center text-gray-600 tabular-nums dark:text-zinc-300">
                            {count}
                          </div>
                        </div>
                      </div>
                      <div className="text-2xs text-gray-500 tabular-nums dark:text-zinc-400">
                        {xl}
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          </details>
        </div>

        <LiveGamesTable games={games} />
      </div>
    </div>
  )
}
