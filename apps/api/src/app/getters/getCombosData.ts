import { Prisma } from '~/generated/prisma/client/client'
import { prisma } from '~/prisma'

export const getCombosData = async (args?: Omit<Prisma.GameFindManyArgs, 'select' | 'include'>) => {
  const games = await prisma.game.findMany(args)

  const wins = games.filter((x) => x.isWin)

  const combos = games.reduce(
    (acc, game) => {
      const { raceAbbr, classAbbr, god, isWin } = game
      const key = [raceAbbr, classAbbr, god].join(',')

      const data = {
        wins: (acc[key]?.wins || 0) + Number(isWin),
        total: (acc[key]?.total || 0) + 1,
      }

      acc[key] = data

      return acc
    },
    {} as Record<string, { wins: number; total: number }>,
  )

  return {
    total: games.length,
    wins: wins.length,
    combos,
  }
}
