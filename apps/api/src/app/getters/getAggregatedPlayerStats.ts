import { Player } from '@prisma/client'
import dayjs from 'dayjs'
import { prisma } from '~/prisma'

export const getAggregatedPlayerStats = async (player: Player) => {
  const [won, lost, all, last30Days] = await Promise.all([
    prisma.game.aggregate({
      where: { playerId: player.id, isWin: true },
      _avg: { uniqueRunes: true, duration: true, turns: true },
      _sum: { uniqueRunes: true },
      _min: { duration: true, turns: true },
      _max: { duration: true, turns: true },
      _count: { _all: true },
    }),
    prisma.game.aggregate({
      where: { playerId: player.id, isWin: false },
      _avg: { uniqueRunes: true },
      _sum: { uniqueRunes: true },
    }),
    prisma.game.aggregate({
      where: { playerId: player.id },
      _avg: { score: true, duration: true },
      _max: { score: true },
      _sum: { score: true, duration: true },
      _count: { _all: true },
    }),
    prisma.game.findMany({
      where: {
        playerId: player.id,
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
      games: all._count._all,
      wins: won._count._all,
      timePlayed: all._sum.duration,
    },
  }
}
