import type { CharStat } from '~/types'

export type ScatterMetric = 'wins' | 'winRate'
export type ComboHighlight = { dimension: 'race' | 'background'; abbr: string; name?: string }
type ComboDimension = { abbr: string; name: string }

export type ComboPoint = CharStat & {
  combo: string
  name: string
  x: number
  y: number
}

export const matchesComboHighlight = (combo: string, highlight?: ComboHighlight) =>
  Boolean(
    highlight?.abbr &&
    (highlight.dimension === 'race'
      ? combo.slice(0, 2) === highlight.abbr
      : combo.slice(2, 4) === highlight.abbr),
  )

export const countCombosInView = (
  points: Pick<ComboPoint, 'x' | 'y'>[],
  bounds: { x: { min: number; max: number }; y: { min: number; max: number } },
) =>
  points.filter(
    ({ x, y }) => x >= bounds.x.min && x <= bounds.x.max && y >= bounds.y.min && y <= bounds.y.max,
  ).length

export const getComboPoints = (
  stats: Record<string, CharStat>,
  races: ComboDimension[],
  classes: ComboDimension[],
  metric: ScatterMetric,
): ComboPoint[] =>
  races.flatMap((race) =>
    classes.flatMap((klass) => {
      const combo = race.abbr + klass.abbr
      const stat = stats[combo]
      if (
        !stat ||
        !Number.isFinite(stat.games) ||
        !Number.isFinite(stat.wins) ||
        stat.games <= 0 ||
        stat.wins < 0 ||
        stat.wins > stat.games
      ) {
        return []
      }

      const winRate = stat.wins / stat.games
      return [
        {
          ...stat,
          combo,
          name: `${race.name} ${klass.name}`,
          winRate,
          x: stat.games,
          y: metric === 'wins' ? stat.wins : winRate * 100,
        },
      ]
    }),
  )

export const getWinRateGuides = (
  maxGames: number,
  maxWins: number,
  { minGames = 0, minWins = 0 } = {},
) => {
  if (
    ![minGames, minWins, maxGames, maxWins].every(Number.isFinite) ||
    minGames < 0 ||
    minWins < 0 ||
    maxGames <= minGames ||
    maxWins <= minWins
  )
    return []

  // Keep the guides spread across the plot, including aggregate data with low win rates.
  const magnitude = Math.min(0.1, 10 ** Math.floor(Math.log10(maxWins / maxGames)))
  return [1, 2.5, 5].flatMap((step) => {
    const rate = step * magnitude
    const startGames = Math.max(minGames, minWins / rate)
    const games = Math.min(maxGames, maxWins / rate)
    if (startGames >= games) return []
    return [{ rate, startGames, startWins: startGames * rate, games, wins: games * rate }]
  })
}
