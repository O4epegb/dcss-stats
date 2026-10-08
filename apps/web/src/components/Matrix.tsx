import { useMemo, useState } from 'react'
import { Tooltip } from '~/components/ui/Tooltip'
import { allUnavailableCombos, Summary } from '~/screens/Player/utils'
import { CharStat } from '~/types'
import { cn, formatNumber, pluralize } from '~/utils'

export const Matrix = ({
  stats,
  races,
  classes,
  greatRaces,
  greatClasses,
  metric,
  coloredHeatMap = false,
  filtered = false,
}: {
  stats: Summary['stats']
  races: Summary['allActualRaces']
  classes: Summary['allActualClasses']
  greatRaces?: Summary['greatRaces']
  greatClasses?: Summary['greatClasses']
  metric: keyof CharStat
  coloredHeatMap?: boolean
  filtered?: boolean
}) => {
  const [[activeRace, activeClass], setActive] = useState<string[]>([])
  const [tooltipRef, setTooltipRef] = useState<HTMLElement | null>(null)

  const formatter = (value: number) =>
    metric === 'winRate'
      ? formatNumber(value * 100, {
          minimumFractionDigits: 1,
          maximumFractionDigits: 1,
        })
      : String(value)

  const activeCombo = (activeRace || '') + (activeClass || '')
  const tooltipStats =
    stats[!activeRace ? 'classes' : !activeClass ? 'races' : 'combos'][activeCombo]

  const valueScales = useMemo(() => buildValueScales(stats), [stats])
  const currentScale = valueScales[metric]
  const isInverted = invertedCategories.has(metric)
  const backgroundClassMaps: BackgroundClassMaps = useMemo(
    () =>
      coloredHeatMap
        ? buildBackgroundClassMaps({
            stats,
            metric,
            scale: currentScale,
            invert: isInverted,
          })
        : {
            combos: {},
            races: {},
            classes: {},
          },
    [stats, metric, currentScale, isInverted, coloredHeatMap],
  )

  return (
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
                  {races.find((x) => x.abbr === activeRace)?.name}
                </span>{' '}
                <span className={cn(greatClasses?.[activeClass] && 'text-matrix-great')}>
                  {greatClasses?.[activeClass] && !activeRace && 'Great '}
                  {classes.find((x) => x.abbr === activeClass)?.name}
                </span>
              </div>
              {tooltipStats?.games > 0 ? (
                <div className="grid grid-cols-2 gap-x-2 font-light">
                  <div>
                    Games: <span className="font-medium">{formatNumber(tooltipStats?.games)}</span>
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
            {classes.map((klass) => (
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
            {classes.map((klass) => {
              const value = stats.classes[klass.abbr]?.[metric]
              const content = value ? formatter(value) : '-'
              const highlightFirstWin =
                metric === 'gamesToFirstWin' && stats.classes[klass.abbr]?.gamesToFirstWin === 1
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
          {races.map((race) => {
            const value = stats.races[race.abbr]?.[metric]
            const content = value ? formatter(value) : '-'
            const highlightFirstWin =
              metric === 'gamesToFirstWin' && stats.races[race.abbr]?.gamesToFirstWin === 1
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
                    highlightFirstWin ? 'bg-matrix-complete' : isActiveRace && 'bg-matrix-selected',
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
                {classes.map((klass) => {
                  const char = race.abbr + klass.abbr
                  if (filtered && !stats.combos[char]) {
                    return (
                      <td
                        key={char}
                        className="border-border-strong bg-surface-emphasis text-muted-foreground/60 border"
                        aria-label={`${race.name} ${klass.name}: excluded by filters`}
                        title="Excluded by filters"
                      >
                        —
                      </td>
                    )
                  }
                  const value = stats.combos[char]?.[metric]
                  const categoryWithZeroAsValid =
                    metric === 'winRate' || metric === 'gamesToFirstWin'
                  const content =
                    categoryWithZeroAsValid && value === 0 ? '-' : value ? formatter(value) : null
                  const isGreyContent = categoryWithZeroAsValid && value === 0
                  const highlightFirstWin =
                    metric === 'gamesToFirstWin' && stats.combos[char]?.gamesToFirstWin === 1
                  const isActiveCell = activeClass === klass.abbr || activeRace === race.abbr
                  const isUnavailable = Boolean(allUnavailableCombos[char])
                  const baseBackgroundClass = backgroundClassMaps.combos[char] || ''
                  const backgroundClass =
                    !highlightFirstWin && !isActiveCell && !isUnavailable ? baseBackgroundClass : ''

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
  metric,
  scale,
  invert,
}: {
  stats: Summary['stats']
  metric: keyof CharStat
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
    const value = stat?.[metric]
    result.classes[abbr] =
      typeof value === 'number' ? getBackgroundClass(value, scale.classes, invert) : ''
  }

  for (const [abbr, stat] of Object.entries(stats.races)) {
    const value = stat?.[metric]
    result.races[abbr] =
      typeof value === 'number' ? getBackgroundClass(value, scale.races, invert) : ''
  }

  for (const [abbr, stat] of Object.entries(stats.combos)) {
    const value = stat?.[metric]
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
