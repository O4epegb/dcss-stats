import { useMediaQuery } from '@react-hookz/web'
import { PropsWithChildren, useEffect, useMemo, useRef, useState } from 'react'
import { Tooltip } from '~/components/ui/Tooltip'
import { allUnavailableCombos, Summary } from '~/screens/Player/utils'
import { CharStat } from '~/types'
import { cn, formatNumber, notEmpty, pluralize } from '~/utils'

export const Matrix = ({
  stats,
  allActualRaces,
  allActualClasses,
  greatRaces,
  greatClasses,
  showTrunkData,
  coloredHeatMap = false,
  toggleShowTrunkData,
  children,
}: PropsWithChildren<{
  stats: Summary['stats']
  allActualRaces: Summary['allActualRaces']
  allActualClasses: Summary['allActualClasses']
  greatRaces?: Summary['greatRaces']
  greatClasses?: Summary['greatClasses']
  showTrunkData?: boolean
  coloredHeatMap?: boolean
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

  const valueScales = useMemo(() => buildValueScales(stats), [stats])
  const currentScale = valueScales[category]
  const isInverted = invertedCategories.has(category)
  const backgroundClassMaps: BackgroundClassMaps = useMemo(
    () =>
      coloredHeatMap
        ? buildBackgroundClassMaps({
            stats,
            category,
            scale: currentScale,
            invert: isInverted,
          })
        : {
            combos: {},
            races: {},
            classes: {},
          },
    [stats, category, currentScale, isInverted, coloredHeatMap],
  )

  return (
    <div ref={ref} className={cn('relative w-full', isSticky && 'sticky top-0')}>
      {children}
      <div className="flex flex-wrap items-center gap-2 py-6">
        <span className="font-medium">Matrix by</span>
        {categories.map(([name, key]) => (
          <button
            key={key}
            className={cn(
              'rounded-sm px-2 py-0.5 font-light',
              category === key ? 'bg-warning text-background' : 'bg-surface-emphasis',
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
            <button className="text-muted-foreground hover:text-accent ml-auto transition">
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
                  <span className={cn(greatRaces?.[activeRace] && 'text-matrix-great')}>
                    {greatRaces?.[activeRace] && !activeClass && 'Great '}
                    {racesToShow.find((x) => x.abbr === activeRace)?.name}
                  </span>{' '}
                  <span className={cn(greatClasses?.[activeClass] && 'text-matrix-great')}>
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
                {allUnavailableCombos[activeCombo] && (
                  <div>Combo is not{tooltipStats?.games > 0 ? ' (normally) ' : ' '}playable</div>
                )}
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
              <th className="min-w-6"></th>
              <th className="min-w-6"></th>
              {classesToShow.map((klass) => (
                <th
                  key={klass.abbr}
                  className={cn(
                    'min-w-6 whitespace-nowrap',
                    greatClasses?.[klass.abbr]
                      ? 'bg-matrix-complete-strong'
                      : activeClass === klass.abbr && 'bg-matrix-selected',
                    !klass.trunk && 'text-muted-foreground/60',
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
            <tr className="h-6">
              <td></td>
              <td></td>
              {classesToShow.map((klass) => {
                const value = stats.classes[klass.abbr]?.[category]
                const content = value ? formatter(value) : '-'
                const highlightFirstWin =
                  category === 'gamesToFirstWin' && stats.classes[klass.abbr]?.gamesToFirstWin === 1
                const isActiveClass = activeClass === klass.abbr
                const baseBackgroundClass = backgroundClassMaps.classes[klass.abbr] || ''
                const backgroundClass =
                  !highlightFirstWin && !isActiveClass ? baseBackgroundClass : ''

                return (
                  <td
                    key={klass.abbr}
                    className={cn(
                      backgroundClass,
                      highlightFirstWin
                        ? 'bg-matrix-complete'
                        : isActiveClass && 'bg-matrix-selected',
                      stats.classes[klass.abbr]?.wins > 0 ? 'text-matrix-great' : 'text-foreground',
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
              const highlightFirstWin =
                category === 'gamesToFirstWin' && stats.races[race.abbr]?.gamesToFirstWin === 1
              const isActiveRace = activeRace === race.abbr
              const baseBackgroundClass = backgroundClassMaps.races[race.abbr] || ''
              const backgroundClass = !highlightFirstWin && !isActiveRace ? baseBackgroundClass : ''

              return (
                <tr key={race.abbr} className="h-6 *:p-px *:first:text-left *:first:font-bold">
                  <td
                    className={cn(
                      greatRaces?.[race.abbr]
                        ? 'bg-matrix-complete-strong'
                        : activeRace === race.abbr && 'bg-matrix-selected',
                      !race.trunk && 'text-muted-foreground/60',
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
                    className={cn(
                      backgroundClass,
                      highlightFirstWin
                        ? 'bg-matrix-complete'
                        : isActiveRace && 'bg-matrix-selected',
                      stats.races[race.abbr]?.wins > 0 ? 'text-matrix-great' : 'text-foreground',
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
                    const categoryWithZeroAsValid =
                      category === 'winRate' || category === 'gamesToFirstWin'
                    const content =
                      categoryWithZeroAsValid && value === 0 ? '-' : value ? formatter(value) : null
                    const isGreyContent = categoryWithZeroAsValid && value === 0
                    const highlightFirstWin =
                      category === 'gamesToFirstWin' && stats.combos[char]?.gamesToFirstWin === 1
                    const isActiveCell = activeClass === klass.abbr || activeRace === race.abbr
                    const isUnavailable = Boolean(allUnavailableCombos[char])
                    const baseBackgroundClass = backgroundClassMaps.combos[char] || ''
                    const backgroundClass =
                      !highlightFirstWin && !isActiveCell && !isUnavailable
                        ? baseBackgroundClass
                        : ''

                    return (
                      <td
                        key={char}
                        className={cn(
                          'border-border-strong border',
                          backgroundClass,
                          highlightFirstWin
                            ? 'bg-matrix-complete'
                            : isActiveCell
                              ? 'bg-matrix-selected'
                              : isUnavailable && 'bg-matrix-unavailable',
                          getTextSizeClass(content),
                          stats.combos[char]?.wins > 0
                            ? 'text-matrix-great'
                            : isUnavailable
                              ? 'text-muted-foreground/60 select-none'
                              : isGreyContent
                                ? 'text-muted-foreground/60'
                                : 'text-foreground',
                        )}
                        onMouseEnter={(e) => {
                          setTooltipRef(e.currentTarget)
                          setActive([race.abbr, klass.abbr])
                        }}
                        onMouseLeave={() => setActive([])}
                      >
                        {content || (isUnavailable && 'x')}
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

type ValueRange = {
  min: number
  max: number
}

type ValueScale = {
  combos: ValueRange | null
  races: ValueRange | null
  classes: ValueRange | null
}

const COLOR_LEVELS = [
  '',
  'bg-matrix-heat-1',
  'bg-matrix-heat-2',
  'bg-matrix-heat-3',
  'bg-matrix-heat-4',
  'bg-matrix-heat-5',
] as const

const invertedCategories = new Set<keyof CharStat>(['gamesToFirstWin'])

const buildValueScales = (stats: Summary['stats']) => {
  const keys: Array<keyof CharStat> = ['wins', 'games', 'winRate', 'maxXl', 'gamesToFirstWin']

  return keys.reduce(
    (acc, key) => {
      acc[key] = {
        combos: getValueRange(stats.combos, key, { excludeZero: true }),
        races: getValueRange(stats.races, key),
        classes: getValueRange(stats.classes, key),
      }

      return acc
    },
    {} as Record<keyof CharStat, ValueScale>,
  )
}

const getValueRange = (
  records: Record<string, CharStat>,
  key: keyof CharStat,
  { excludeZero = false } = {},
): ValueRange | null => {
  return Object.values(records).reduce<ValueRange | null>((range, item) => {
    const value = item?.[key]
    if (typeof value !== 'number' || !Number.isFinite(value) || (excludeZero && value === 0)) {
      return range
    }

    if (!range) {
      return { min: value, max: value }
    }

    return {
      min: Math.min(range.min, value),
      max: Math.max(range.max, value),
    }
  }, null)
}

type BackgroundClassMaps = {
  combos: Record<string, string>
  races: Record<string, string>
  classes: Record<string, string>
}

const buildBackgroundClassMaps = ({
  stats,
  category,
  scale,
  invert,
}: {
  stats: Summary['stats']
  category: keyof CharStat
  scale: ValueScale | undefined
  invert: boolean
}): BackgroundClassMaps => {
  const result: BackgroundClassMaps = {
    combos: {},
    races: {},
    classes: {},
  }

  if (!scale) {
    return result
  }

  for (const [abbr, stat] of Object.entries(stats.classes)) {
    const value = stat?.[category]
    result.classes[abbr] =
      typeof value === 'number' ? getBackgroundClass(value, scale.classes, invert) : ''
  }

  for (const [abbr, stat] of Object.entries(stats.races)) {
    const value = stat?.[category]
    result.races[abbr] =
      typeof value === 'number' ? getBackgroundClass(value, scale.races, invert) : ''
  }

  for (const [abbr, stat] of Object.entries(stats.combos)) {
    const value = stat?.[category]
    result.combos[abbr] =
      typeof value === 'number' ? getBackgroundClass(value, scale.combos, invert) : ''
  }

  return result
}

const getBackgroundClass = (
  value: number | undefined,
  range: ValueRange | null | undefined,
  invert: boolean,
) => {
  const grade = getColorGrade(value, range, COLOR_LEVELS.length - 1, invert)

  return grade ? COLOR_LEVELS[grade] : ''
}

const getColorGrade = (
  value: number | undefined,
  range: ValueRange | null | undefined,
  steps: number,
  invert: boolean,
) => {
  if (!range || value == null || !Number.isFinite(value)) {
    return 0
  }

  if (value <= 0 && range.max > 0) {
    return 0
  }

  if (range.max === range.min) {
    return range.max === 0 ? 0 : steps
  }

  let ratio = invert
    ? (range.max - value) / (range.max - range.min)
    : (value - range.min) / (range.max - range.min)

  if (!Number.isFinite(ratio)) {
    return 0
  }

  ratio = Math.min(Math.max(ratio, 0), 1)

  const grade = Math.floor(ratio * steps)

  return Math.min(grade, steps)
}
