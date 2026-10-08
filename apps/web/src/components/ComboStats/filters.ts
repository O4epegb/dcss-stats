import { getComboPoints } from '~/components/ComboScatterPlot/data'
import type { FilterItemType } from '~/components/Filters'
import type { Summary } from '~/screens/Player/utils'
import type { CharStat, StaticData } from '~/types'

type Dimension = { abbr: string; name: string }
const numericConditions = ['>=', '>', '=', '!=', '<', '<=']

export const getComboFilterOptions = (
  races: Dimension[],
  classes: Dimension[],
): StaticData['filterOptions'] => [
  ...['Games', 'Wins', 'Win rate %'].map((name) => ({
    name,
    type: 'number',
    conditions: numericConditions,
    suboptions: [],
    placeholder: name === 'Win rate %' ? '0–100' : 'Count',
    values: [],
  })),
  ...[
    { name: 'Race', items: races },
    { name: 'Background', items: classes },
  ].map(({ name, items }) => ({
    name,
    type: 'select',
    conditions: ['=', '!='],
    suboptions: [],
    placeholder: '',
    values: items.map((item) => item.name).sort((a, b) => a.localeCompare(b)),
  })),
]

const compare = (actual: number | string, condition: string, expected: number | string) => {
  switch (condition) {
    case '=':
      return actual === expected
    case '!=':
      return actual !== expected
    case '>=':
      return actual >= expected
    case '>':
      return actual > expected
    case '<=':
      return actual <= expected
    case '<':
      return actual < expected
    default:
      return false
  }
}

const addStat = (total: CharStat | undefined, stat: CharStat): CharStat => {
  const games = (total?.games ?? 0) + stat.games
  const wins = (total?.wins ?? 0) + stat.wins
  const maxXls = [total?.maxXl, stat.maxXl].filter((xl) => xl != null)
  return {
    games,
    wins,
    winRate: wins / games,
    maxXl: maxXls.length ? Math.max(...maxXls) : undefined,
    // A first-win chronology cannot be reconstructed from combination totals.
    gamesToFirstWin: undefined,
  }
}

export const filterComboStats = <T extends Dimension>(
  stats: Summary['stats'],
  races: T[],
  classes: T[],
  filters: FilterItemType[],
) => {
  const options = getComboFilterOptions(races, classes)
  const activeFilters = filters.filter((filter) => {
    const option = options.find((item) => item.name === filter.option)
    const value = filter.value?.trim()
    return (
      option &&
      value &&
      option.conditions.includes(filter.condition) &&
      (option.type !== 'number' || Number.isFinite(Number(value)))
    )
  })
  const points = getComboPoints(stats.combos, races, classes, 'wins')
  if (!activeFilters.length) {
    return { stats, races, classes, count: points.length, total: points.length, filterCount: 0 }
  }

  // The Filters UI groups OR-connected rules, then ANDs those groups together.
  const groups: FilterItemType[][] = [[]]
  activeFilters.forEach((filter, index) => {
    groups[groups.length - 1].push(filter)
    if (filter.operator !== 'or' && index < activeFilters.length - 1) groups.push([])
  })
  const raceNames = new Map(races.map((item) => [item.abbr, item.name]))
  const classNames = new Map(classes.map((item) => [item.abbr, item.name]))
  const filtered: Summary['stats'] = { combos: {}, races: {}, classes: {} }
  for (const point of points) {
    const race = point.combo.slice(0, 2)
    const klass = point.combo.slice(2, 4)
    const values: Record<string, number | string> = {
      Race: raceNames.get(race)!,
      Background: classNames.get(klass)!,
      Games: point.games,
      Wins: point.wins,
      // Scale counts before division to preserve exact percentage boundaries.
      'Win rate %': (point.wins * 100) / point.games,
    }
    const matches = groups.every((group) =>
      group.some((filter) => {
        const actual = values[filter.option]
        const expected = typeof actual === 'number' ? Number(filter.value) : filter.value!
        return compare(actual, filter.condition, expected)
      }),
    )
    if (!matches) continue
    filtered.combos[point.combo] = stats.combos[point.combo]
    filtered.races[race] = addStat(filtered.races[race], point)
    filtered.classes[klass] = addStat(filtered.classes[klass], point)
  }

  return {
    stats: filtered,
    races: races.filter((race) => filtered.races[race.abbr]),
    classes: classes.filter((klass) => filtered.classes[klass.abbr]),
    count: Object.keys(filtered.combos).length,
    total: points.length,
    filterCount: activeFilters.length,
  }
}
