import dayjs from 'dayjs'
import { Player, Prisma } from '~/generated/prisma/client/client'
import { prisma } from '~/prisma'

export const getAggregatedPlayerStats = async (
  player: Player,
  gamesWhere?: Prisma.GameWhereInput,
) => {
  const baseWhere: Prisma.GameWhereInput = {
    playerId: player.id,
    ...gamesWhere,
  }

  const [won, lost, all, last30Days] = await Promise.all([
    prisma.game.aggregate({
      where: { ...baseWhere, isWin: true },
      _avg: { uniqueRunes: true, duration: true, turns: true },
      _sum: { uniqueRunes: true, gems: true },
      _min: { duration: true, turns: true },
      _max: { duration: true, turns: true },
      _count: { _all: true },
    }),
    prisma.game.aggregate({
      where: { ...baseWhere, isWin: false },
      _avg: { uniqueRunes: true },
      _sum: { uniqueRunes: true, gems: true },
    }),
    prisma.game.aggregate({
      where: baseWhere,
      _avg: { score: true, duration: true, turns: true },
      _max: { score: true },
      _sum: { score: true, duration: true },
      _count: { _all: true },
    }),
    prisma.game.findMany({
      where: {
        ...baseWhere,
        startAt: { gte: dayjs().subtract(30, 'days').startOf('day').toDate() },
      },
    }),
  ])

  return {
    lastMonth: {
      wins: last30Days.filter((game) => game.isWin).length,
      total: last30Days.length,
    },
    average: {
      score: all._avg.score,
      runesWon: won._avg.uniqueRunes,
      runesLost: lost._avg.uniqueRunes,
      gameTime: all._avg.duration,
      gameTurnCount: all._avg.turns,
      winTime: won._avg.duration,
      winTurnCount: won._avg.turns,
    },
    max: {
      score: all._max.score,
      winTime: won._max.duration,
      winTurnCount: won._max.turns,
    },
    min: {
      winTime: won._min.duration,
      winTurnCount: won._min.turns,
    },
    total: {
      score: all._sum.score,
      runesWon: won._sum.uniqueRunes,
      runesLost: lost._sum.uniqueRunes,
      gemsWon: won._sum.gems,
      gemsLost: lost._sum.gems,
      games: all._count._all,
      wins: won._count._all,
      timePlayed: all._sum.duration,
    },
  }
}
