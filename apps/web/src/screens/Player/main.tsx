import clsx from 'clsx'
import { useMemo, useState, useEffect, ReactNode } from 'react'
import { Logo } from '~/components/Logo'
import { ThemeSelector } from '~/components/ThemeSelector'
import { WinrateStats } from '~/components/WinrateStats'
import { Tooltip } from '~/components/ui/Tooltip'
import { pluralize, formatNumber, trackEvent } from '~/utils'
import { Games } from './Games'
import { Matrix } from './Matrix'
import { Stats } from './Stats'
import { Streaks } from './Streaks'
import { Titles } from './Titles'
import { usePlayerPageContext } from './context'
import { addToFavorite, getFavorites, getSummary, removeFromFavorite } from './utils'

export const Player = () => {
  const { player, races, classes, matrix, gods, stats, gamesToFirstWin, tiamat } =
    usePlayerPageContext()
  const [isFavorite, setIsFavorite] = useState(false)

  useEffect(() => {
    setIsFavorite(getFavorites().split(',').indexOf(player.name) !== -1)
  }, [])

  const summary = useMemo(() => getSummary(matrix, races, classes, gods, gamesToFirstWin), [matrix])
  const {
    trunkClasses,
    trunkRaces,
    wonRaces,
    wonClasses,
    wonGods,
    notWonClasses,
    notWonGods,
    notWonRaces,
    allActualClasses,
    allActualRaces,
  } = summary

  const isGreat = wonRaces.length === trunkRaces.length
  const isGrand = wonClasses.length === trunkClasses.length
  const isGreater = isGreat && isGrand
  const isPolytheist = wonGods.length === gods.length
  const isTiamat = tiamat.unwon.length === 0

  const wonGodsStats = (
    <ul>
      {gods
        .filter((god) => god.wins > 0)
        .map((god) => (
          <li key={god.name}>
            {god.name}: {god.wins}W {god.games}G (
            {formatNumber((god.wins / god.games || 0) * 100, {
              maximumFractionDigits: 2,
            })}
            %)
          </li>
        ))}
    </ul>
  )

  return (
    <div className="container mx-auto grid gap-4 px-4 xl:grid-cols-3">
      <div className="min-w-0">
        <header className="flex items-center justify-between pb-2 pr-4 pt-4">
          <Logo />
          <ThemeSelector />
        </header>
        <div className="space-y-2">
          <section className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <h2 className="text-3xl font-bold">{player.name}</h2>
            <Tooltip content={isFavorite ? 'Remove from favorites' : 'Add to favorites'}>
              <button
                className={clsx(
                  'flex h-6 w-6 items-center justify-center rounded transition-colors hover:bg-gray-100 dark:hover:bg-zinc-700',
                  isFavorite ? 'text-amber-400' : 'text-gray-300',
                )}
                onClick={() => {
                  const newIsFavorite = !isFavorite

                  if (newIsFavorite) {
                    addToFavorite(player.name)
                  } else {
                    removeFromFavorite(player.name)
                  }

                  trackEvent(newIsFavorite ? 'Add favorite' : 'Remove favorite', {
                    name: player.name,
                  })

                  setIsFavorite(newIsFavorite)
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </button>
            </Tooltip>
            <div className="flex flex-wrap gap-2 text-sm">
              {isGreater ? (
                <Tooltip
                  content={
                    <div>
                      Has won with all races and all classes
                      <div className="pt-2 text-xs text-gray-300 dark:text-gray-700">
                        Achievements were renamed to Great/Grand/Greater because of <br /> name
                        clash with Discord command
                      </div>
                    </div>
                  }
                >
                  <div className="rounded bg-amber-300 px-1 py-0.5 text-black ring-2 ring-inset ring-amber-600">
                    Greater Player
                  </div>
                </Tooltip>
              ) : (
                <>
                  {isGreat && (
                    <Tooltip content="Has won with all races">
                      <div className="rounded bg-amber-300 px-1 py-0.5 text-black">
                        Great Player
                      </div>
                    </Tooltip>
                  )}
                  {isGrand && (
                    <Tooltip content="Has won with all classes">
                      <div className="rounded bg-amber-300 px-1 py-0.5 text-black">
                        Grand Player
                      </div>
                    </Tooltip>
                  )}
                </>
              )}
              {isPolytheist && (
                <Tooltip
                  interactive
                  content={
                    <div className="space-y-2">
                      <div>Has won with all gods:</div>
                      {wonGodsStats}
                    </div>
                  }
                >
                  <div className="rounded bg-sky-300 px-1 py-0.5 text-black">Polytheist</div>
                </Tooltip>
              )}
              {isTiamat && (
                <Tooltip content="Has won with every Draconian color">
                  <div className="rounded bg-purple-300 px-1 py-0.5 text-black">Tiamat</div>
                </Tooltip>
              )}
            </div>
          </section>
          <section>
            <WinrateStats wins={stats.total.wins} games={stats.total.games} />
            <div className="text-xs">
              {stats.lastMonth.total} {pluralize('game', stats.lastMonth.total)} and{' '}
              {stats.lastMonth.wins} {pluralize('win', stats.lastMonth.wins)}{' '}
              {stats.lastMonth.wins > 0 && (
                <>
                  (
                  {formatNumber((stats.lastMonth.wins / stats.lastMonth.total || 1) * 100, {
                    maximumFractionDigits: 2,
                  })}
                  %){' '}
                </>
              )}
              in the last 30 days
            </div>
          </section>

          <section className="flex flex-row flex-wrap items-start gap-2 text-xs empty:hidden">
            {!isGreat && (
              <Badge
                title="Great Player"
                total={trunkRaces.length}
                completed={wonRaces.length}
                leftToWinWith={notWonRaces}
              />
            )}
            {!isGrand && (
              <Badge
                title="Grand Player"
                total={trunkClasses.length}
                completed={wonClasses.length}
                leftToWinWith={notWonClasses}
              />
            )}
            {!isPolytheist && (
              <Badge
                title="Polytheist"
                total={gods.length}
                completed={wonGods.length}
                leftToWinWith={notWonGods}
                additionalContent={
                  <>
                    <div>Already won:</div>
                    {wonGodsStats}
                  </>
                }
              />
            )}
            {!isTiamat && (
              <Badge
                title="Tiamat"
                total={tiamat.total}
                completed={tiamat.total - tiamat.unwon.length}
                leftToWinWith={tiamat.unwon.map((name) => ({ name }))}
              />
            )}
          </section>
          <Stats summary={summary} />
          <Titles />
          <Streaks />
          <Games allActualRaces={allActualRaces} allActualClasses={allActualClasses} />
        </div>
      </div>
      <div className="min-w-0 xl:col-span-2">
        <Matrix summary={summary} />
      </div>
    </div>
  )
}

const Badge = ({
  completed,
  total,
  leftToWinWith,
  title,
  additionalContent,
}: {
  completed: number
  total: number
  leftToWinWith?: Array<{ name: string }>
  title: string
  additionalContent?: ReactNode
}) => {
  return (
    <Tooltip
      interactive
      disabled={!leftToWinWith}
      content={
        <div className="space-y-2">
          <div>Need to win with:</div>
          {leftToWinWith && (
            <ul>
              {leftToWinWith.map((item) => (
                <li key={item.name}>{item.name}</li>
              ))}
            </ul>
          )}
          {additionalContent}
        </div>
      }
    >
      <div className="relative overflow-hidden rounded bg-gray-100 px-1 py-0.5 dark:bg-zinc-700">
        <div
          className="absolute bottom-0 left-0 top-0 bg-gray-200 dark:bg-zinc-600"
          style={{
            width: `${(completed / total) * 100}%`,
          }}
        />
        <span className="relative z-[1]">
          {title} {completed} of {total}
        </span>
      </div>
    </Tooltip>
  )
}
