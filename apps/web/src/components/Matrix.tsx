import { useMediaQuery } from '@react-hookz/web'
import clsx from 'clsx'
import { PropsWithChildren, useEffect, useMemo, useRef, useState } from 'react'
import { Tooltip } from '~/components/ui/Tooltip'
import { Summary, allUnavailableCombos } from '~/screens/Player/utils'
import { CharStat } from '~/types'
import { pluralize, formatNumber, notEmpty } from '~/utils'

export const Matrix = ({
  stats,
  allActualRaces,
  allActualClasses,
  greatRaces,
  greatClasses,
  showTrunkData,
  toggleShowTrunkData,
  children,
}: PropsWithChildren<{
  stats: Summary['stats']
  allActualRaces: Summary['allActualRaces']
  allActualClasses: Summary['allActualClasses']
  greatRaces?: Summary['greatRaces']
  greatClasses?: Summary['greatClasses']
  showTrunkData?: boolean
  toggleShowTrunkData?: () => void
}>) => {
  const isWide = useMediaQuery('(min-width: 1280px)', { initializeWithValue: false })
  const [isSticky, setIsSticky] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const [[activeRace, activeClass], setActive] = useState<string[]>([])
  const [category, setCategory] = useState<keyof CharStat>('wins')
  const [tooltipRef, setTooltipRef] = useState<HTMLElement | null>(null)

  const racesToShow = showTrunkData ? allActualRaces.filter((x) => x.trunk) : allActualRaces
  const classesToShow = showTrunkData ? allActualClasses.filter((x) => x.trunk) : allActualClasses

  useEffect(() => {
    const shouldBeSticky = isWide && ref.current && window.innerHeight > ref.current?.offsetHeight
    setIsSticky(Boolean(shouldBeSticky))
  }, [isWide, ref.current, showTrunkData])

  const formatter = (value: number) =>
    category === 'winRate'
      ? formatNumber(value * 100, {
          minimumFractionDigits: 1,
          maximumFractionDigits: 1,
        })
      : String(value)

  const activeCombo = (activeRace || '') + (activeClass || '')
  const tooltipStats =
    stats[!activeRace ? 'classes' : !activeClass ? 'races' : 'combos'][activeCombo]

  const someItemHasMaxXL = useMemo(
    () => Object.values(stats.combos).some((x) => x.maxXl != null),
    [stats.combos],
  )
  const someItemHasFirstWin = useMemo(
    () => Object.values(stats.combos).some((x) => x.gamesToFirstWin != null),
    [stats.combos],
  )

  const categories = (
    [
      ['wins', 'wins'],
      ['games', 'games'],
      ['win rate %', 'winRate'],
      someItemHasMaxXL ? (['best XL', 'maxXl'] as const) : null,
      someItemHasFirstWin ? (['first win', 'gamesToFirstWin'] as const) : null,
    ] as const
  ).filter(notEmpty)

  return (
    <div ref={ref} className={clsx('relative w-full', isSticky && 'sticky top-0')}>
      {children}
      <div className="flex flex-wrap items-center gap-2 py-6">
        <span className="font-medium">Matrix by</span>
        {categories.map(([name, key]) => (
          <button
            key={key}
            className={clsx(
              'rounded-sm px-2 py-0.5 font-light',
              category === key ? 'bg-amber-700 text-white' : 'bg-gray-100 dark:bg-zinc-700',
            )}
            onClick={() => setCategory(key)}
          >
            {name}
          </button>
        ))}
        {toggleShowTrunkData && (
          <Tooltip
            interactive
            content={
              <div className="flex flex-col gap-1">
                Matrix display settings
                <hr />
                <label className="inline-flex items-center gap-1">
                  <input
                    checked={showTrunkData}
                    type="checkbox"
                    onChange={() => toggleShowTrunkData()}
                  />{' '}
                  Only show combos from trunk
                </label>
              </div>
            }
          >
            <button className="ml-auto text-gray-400 transition hover:text-emerald-500">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </Tooltip>
        )}
      </div>
      <div className="relative overflow-x-auto xl:overflow-x-visible">
        {(activeClass || activeRace) && tooltipRef && (
          <Tooltip
            restMs={0}
            delay={0}
            triggerElement={tooltipRef}
            content={
              <div className="space-y-2">
                <div>
                  <span
                    className={clsx(
                      greatRaces?.[activeRace] && 'text-amber-300 dark:text-amber-700',
                    )}
                  >
                    {greatRaces?.[activeRace] && !activeClass && 'Great '}
                    {racesToShow.find((x) => x.abbr === activeRace)?.name}
                  </span>{' '}
                  <span
                    className={clsx(
                      greatClasses?.[activeClass] && 'text-amber-300 dark:text-amber-700',
                    )}
                  >
                    {greatClasses?.[activeClass] && !activeRace && 'Great '}
                    {classesToShow.find((x) => x.abbr === activeClass)?.name}
                  </span>
                </div>
                {tooltipStats?.games > 0 ? (
                  <div className="grid grid-cols-2 gap-x-2 font-light">
                    <div>
                      Games:{' '}
                      <span className="font-medium">{formatNumber(tooltipStats?.games)}</span>
                    </div>
                    <div className="text-right">
                      Win rate:{' '}
                      <span className="font-medium">
                        {formatNumber(tooltipStats?.winRate * 100, {
                          maximumFractionDigits: 2,
                        })}
                        %
                      </span>
                    </div>
                    <div>
                      Wins: <span className="font-medium">{tooltipStats?.wins}</span>
                    </div>
                    {tooltipStats?.maxXl != null && (
                      <div className="text-right">
                        Max XL: <span className="font-medium">{tooltipStats?.maxXl}</span>
                      </div>
                    )}
                    {tooltipStats.gamesToFirstWin != null && tooltipStats.gamesToFirstWin > 0 && (
                      <div className="col-span-full">
                        First win after{' '}
                        <span className="font-medium">{tooltipStats.gamesToFirstWin}</span>{' '}
                        {pluralize('game', tooltipStats.gamesToFirstWin)}
                      </div>
                    )}
                  </div>
                ) : (
                  !allUnavailableCombos[activeCombo] && <div>No data yet</div>
                )}
                {allUnavailableCombos[activeCombo] && <div>Combo is not playable</div>}
                {!(activeRace && activeClass) &&
                  (greatClasses?.[activeClass] || greatRaces?.[activeRace]) && (
                    <div className="text-xs">
                      Great — won all possible combos with {activeRace ? 'race' : 'class'}
                    </div>
                  )}
              </div>
            }
          />
        )}

        <table className="w-auto min-w-full border-collapse text-center text-sm xl:w-full 2xl:text-base">
          <thead>
            <tr>
              <th className="min-w-[24px]"></th>
              <th className="min-w-[24px]"></th>
              {classesToShow.map((klass) => (
                <th
                  key={klass.abbr}
                  className={clsx(
                    'min-w-[24px] whitespace-nowrap',

                    greatClasses?.[klass.abbr]
                      ? 'bg-amber-200 dark:bg-amber-700'
                      : activeClass === klass.abbr && 'bg-amber-100 dark:bg-zinc-800',
                    !klass.trunk && 'text-gray-400',
                  )}
                  onMouseEnter={(e) => {
                    setActive(['', klass.abbr])

                    setTooltipRef(e.currentTarget)
                  }}
                  onMouseLeave={() => setActive([])}
                >
                  {klass.abbr}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="h-[24px]">
              <td></td>
              <td></td>
              {classesToShow.map((klass) => {
                const value = stats.classes[klass.abbr]?.[category]
                const content = value ? formatter(value) : '-'

                return (
                  <td
                    key={klass.abbr}
                    className={clsx(
                      category === 'gamesToFirstWin' &&
                        stats.classes[klass.abbr]?.gamesToFirstWin === 1
                        ? 'bg-amber-200 dark:bg-amber-900'
                        : activeClass === klass.abbr && 'bg-amber-100 dark:bg-zinc-800',
                      stats.classes[klass.abbr]?.wins > 0
                        ? 'text-amber-600 dark:text-amber-500'
                        : 'dark:text-gray-200',
                      getTextSizeClass(content),
                    )}
                    onMouseEnter={(e) => {
                      setActive(['', klass.abbr])

                      setTooltipRef(e.currentTarget)
                    }}
                    onMouseLeave={() => setActive([])}
                  >
                    {content}
                  </td>
                )
              })}
            </tr>
            {racesToShow.map((race) => {
              const value = stats.races[race.abbr]?.[category]
              const content = value ? formatter(value) : '-'

              return (
                <tr
                  key={race.abbr}
                  className="h-[24px] *:p-[1px] *:first:text-left *:first:font-bold"
                >
                  <td
                    className={clsx(
                      greatRaces?.[race.abbr]
                        ? 'bg-amber-200 dark:bg-amber-700'
                        : activeRace === race.abbr && 'bg-amber-100 dark:bg-zinc-800',
                      !race.trunk && 'text-gray-400',
                    )}
                    onMouseEnter={(e) => {
                      setActive([race.abbr])

                      setTooltipRef(e.currentTarget)
                    }}
                    onMouseLeave={() => setActive([])}
                  >
                    {race.abbr}
                  </td>
                  <td
                    className={clsx(
                      category === 'gamesToFirstWin' &&
                        stats.races[race.abbr]?.gamesToFirstWin === 1
                        ? 'bg-amber-200 dark:bg-amber-900'
                        : activeRace === race.abbr && 'bg-amber-100 dark:bg-zinc-800',
                      stats.races[race.abbr]?.wins > 0
                        ? 'text-amber-600 dark:text-amber-500'
                        : 'dark:text-gray-200',
                      getTextSizeClass(content),
                    )}
                    onMouseEnter={(e) => {
                      setActive([race.abbr])

                      setTooltipRef(e.currentTarget)
                    }}
                    onMouseLeave={() => setActive([])}
                  >
                    {content}
                  </td>
                  {classesToShow.map((klass) => {
                    const char = race.abbr + klass.abbr
                    const value = stats.combos[char]?.[category]
                    const content = value ? formatter(value) : null

                    return (
                      <td
                        key={char}
                        className={clsx(
                          'border dark:border-gray-600',
                          category === 'gamesToFirstWin' &&
                            stats.combos[char]?.gamesToFirstWin === 1
                            ? 'bg-amber-200 dark:bg-amber-900'
                            : activeClass === klass.abbr || activeRace === race.abbr
                              ? 'bg-amber-100 dark:bg-zinc-800'
                              : allUnavailableCombos[char] && 'bg-gray-50 dark:bg-zinc-900',
                          getTextSizeClass(content),
                          stats.combos[char]?.wins > 0
                            ? 'text-amber-600 dark:text-amber-500'
                            : allUnavailableCombos[char]
                              ? 'text-gray-200 select-none dark:text-gray-600'
                              : 'dark:text-gray-200',
                        )}
                        onMouseEnter={(e) => {
                          setTooltipRef(e.currentTarget)
                          setActive([race.abbr, klass.abbr])
                        }}
                        onMouseLeave={() => setActive([])}
                      >
                        {content || (allUnavailableCombos[char] && 'x')}
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

const getTextSizeClass = (content: string | null) => {
  return (
    content &&
    (content.length > 4
      ? 'text-2xs'
      : content.length > 3
        ? 'text-xs '
        : content.length > 2
          ? 'text-xs 2xl:text-xs'
          : '')
  )
}
