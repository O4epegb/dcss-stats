import { orderBy, reduce, groupBy, maxBy } from 'lodash-es'
import { Game } from '@prisma/client'

export const getMatrix = (games: Game[]) => {
  games = orderBy(games, (g) => g.startAt, 'asc')

  const gamesToFirstWin = {
    classes: reduce(
      groupBy(games, (g) => g.classAbbr),
      (acc, value, key) => {
        const count = value.findIndex((g) => g.isWin)

        acc[key] = count < 0 ? 0 : count + 1

        return acc
      },
      {} as Record<string, number>,
    ),
    races: reduce(
      groupBy(games, (g) => g.raceAbbr),
      (acc, value, key) => {
        const count = value.findIndex((g) => g.isWin)

        acc[key] = count < 0 ? 0 : count + 1

        return acc
      },
      {} as Record<string, number>,
    ),
  }

  return {
    gamesToFirstWin,
    matrix: reduce(
      groupBy(games, (g) => g.char),
      (acc, value, key) => {
        const games = value.length
        const wins = value.filter((g) => g.isWin).length
        const gamesToFirstWin = value.findIndex((g) => g.isWin)

        acc[key] = {
          wins,
          games,
          winRate: Math.round((wins / games) * 100) / 100,
          maxXl: maxBy(value, (g) => g.xl)?.xl ?? 0,
          gamesToFirstWin: gamesToFirstWin < 0 ? 0 : gamesToFirstWin + 1,
        }

        return acc
      },
      {} as Record<
        string,
        { wins: number; games: number; winRate: number; maxXl: number; gamesToFirstWin: number }
      >,
    ),
  }
}
