import { useMediaQuery } from '@react-hookz/web'
import clsx from 'clsx'
import { useEffect, useRef, useState } from 'react'
import { Tooltip } from '~/components/ui/Tooltip'
import { CharStat } from '~/types'
import { pluralize, formatNumber } from '~/utils'
import { usePlayerPageContext } from './context'
import { Summary, allUnavailableCombos } from './utils'

const items = [
  ['wins', 'wins'],
  ['games', 'games'],
  ['win rate %', 'winRate'],
  ['best XL', 'maxXl'],
  ['first win', 'gamesToFirstWin'],
] as const

export const Matrix = ({ summary }: { summary: Summary }) => {
  const { toggleOption, isOptionEnabled } = usePlayerPageContext()
  const isWide = useMediaQuery('(min-width: 1280px)', { initializeWithValue: false })
  const [isSticky, setIsSticky] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const [[activeRace, activeClass], setActive] = useState<string[]>([])
  const [category, setCategory] = useState<keyof CharStat>('wins')
  const [tooltipRef, setTooltipRef] = useState<HTMLElement | null>(null)
  const { stats, allActualRaces, allActualClasses, greatRaces, greatClasses } = summary

  const showTrunkData = isOptionEnabled('dcss-show-trunk-data')
  const racesToShow = showTrunkData ? allActualRaces.filter((x) => x.trunk) : allActualRaces
  const classesToShow = showTrunkData ? allActualClasses.filter((x) => x.trunk) : allActualClasses

  useEffect(() => {
    const shouldBeSticky = isWide && ref.current && window.innerHeight > ref.current?.offsetHeight
    setIsSticky(Boolean(shouldBeSticky))
  }, [isWide, ref.current, showTrunkData])

  const formatter = (value: number) =>
    category === 'winRate' ? formatNumber(value * 100, { maximumFractionDigits: 0 }) : String(value)

  const activeCombo = (activeRace || '') + (activeClass || '')
  const tooltipStats =
    stats[!activeRace ? 'classes' : !activeClass ? 'races' : 'combos'][activeCombo]

  return (
    <div ref={ref} className={clsx('w-full', isSticky && 'sticky top-0')}>
      <div className="flex flex-wrap items-center justify-center gap-2 py-6">
        <span className="font-medium">Matrix by</span>
        {items.map(([name, key]) => (
          <button
            key={key}
            className={clsx(
              'rounded px-2 py-0.5 font-light',
              category === key ? 'bg-amber-700 text-white' : 'bg-gray-100 dark:bg-zinc-700',
            )}
            onClick={() => setCategory(key)}
          >
            {name}
          </button>
        ))}
        <Tooltip
          interactive
          content={
            <div className="flex flex-col gap-1">
              Matrix display settings
              <hr />
              <label className="inline-flex items-center gap-1">
                <input
                  checked={isOptionEnabled('dcss-show-trunk-data')}
                  type="checkbox"
                  onChange={() => toggleOption('dcss-show-trunk-data')}
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
                    className={clsx(greatRaces[activeRace] && 'text-amber-300 dark:text-amber-700')}
                  >
                    {greatRaces[activeRace] && !activeClass && 'Great '}
                    {racesToShow.find((x) => x.abbr === activeRace)?.name}
                  </span>{' '}
                  <span
                    className={clsx(
                      greatClasses[activeClass] && 'text-amber-300 dark:text-amber-700',
                    )}
                  >
                    {greatClasses[activeClass] && !activeRace && 'Great '}
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
                    <div className="text-right">
                      Max XL: <span className="font-medium">{tooltipStats?.maxXl}</span>
                    </div>
                    {tooltipStats.gamesToFirstWin > 0 && (
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
                  (greatClasses[activeClass] || greatRaces[activeRace]) && (
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

                    greatClasses[klass.abbr]
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
                    )}
                    onMouseEnter={(e) => {
                      setActive(['', klass.abbr])

                      setTooltipRef(e.currentTarget)
                    }}
                    onMouseLeave={() => setActive([])}
                  >
                    {value ? formatter(value) : '-'}
                  </td>
                )
              })}
            </tr>
            {racesToShow.map((race) => {
              const value = stats.races[race.abbr]?.[category]

              return (
                <tr key={race.abbr} className="h-[24px]">
                  <td
                    className={clsx(
                      'text-left font-bold',
                      greatRaces[race.abbr]
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
                    )}
                    onMouseEnter={(e) => {
                      setActive([race.abbr])

                      setTooltipRef(e.currentTarget)
                    }}
                    onMouseLeave={() => setActive([])}
                  >
                    {value ? formatter(value) : '-'}
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
                          content && content?.length > 2 && 'text-xs 2xl:text-sm',
                          stats.combos[char]?.wins > 0
                            ? 'text-amber-600 dark:text-amber-500'
                            : allUnavailableCombos[char]
                              ? 'text-gray-200 dark:text-gray-600 select-none'
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
