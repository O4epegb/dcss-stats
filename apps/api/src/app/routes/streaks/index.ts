import { CronJob } from 'cron'
import dayjs from 'dayjs'
import PQueue from 'p-queue'
import Type from 'typebox'
import { AppType } from '~/app'
import { getStreaksByPlayer } from '~/app/getters/getStreaks'
import { prisma } from '~/prisma'
import { logger } from '~/utils'

const streakQueue = new PQueue({
  concurrency: 1,
  timeout: 60000,
  throwOnTimeout: true,
})

const streaksCronJob = CronJob.from({
  cronTime: '0 3 * * *',
  onTick: async () => {
    const players = await prisma.player.findMany({
      where: {
        isBot: false,
        game: {
          some: {
            endAt: {
              gte: dayjs().subtract(25, 'hours').toDate(),
            },
          },
        },
      },
      select: {
        id: true,
      },
    })

    for (const player of players) {
      streakQueue.add(() => calculateStreaksForPlayer(player.id))
    }

    streakQueue.once('idle', () => {
      startBackFillQueue()
    })
  },
})

export const streaksRoute = (app: AppType) => {
  if (!process.env.DCSS_SKIP_STREAKS_BACKFILL) {
    startBackFillQueue()
  }

  streaksCronJob.start()

  app.get('/api/streaks/meta', async () => {
    const playersWithStreaks = await prisma.player.count({
      where: {
        streaks: {
          some: {},
        },
      },
    })
    const playersWithoutStreaks = await prisma.player.count({
      where: {
        streaks: {
          none: {},
        },
        isBot: false,
      },
    })
    const totalStreaks = await prisma.streak.count()
    const uniqueCharStreaks = await prisma.streak.count({
      where: {
        isUniqueByChar: true,
      },
    })

    return {
      queueSize: streakQueue.size,
      queueStatus: streakQueue.isPaused ? 'paused' : 'running',
      totalStreaks,
      uniqueCharStreaks,
      playersWithStreaks,
      playersWithoutStreaks,
    }
  })

  const Querystring = Type.Object({
    isBroken: Type.Optional(Type.Boolean()),
    isUniqueByChar: Type.Optional(Type.Boolean()),
  })

  app.get(
    '/api/streaks',
    {
      schema: {
        querystring: Querystring,
      },
    },
    async (request) => {
      const streaks = await prisma.streak.findMany({
        take: 100,
        orderBy: {
          length: 'desc',
        },
        where: {
          isBroken: request.query.isBroken,
          isUniqueByChar: request.query.isUniqueByChar,
        },
        include: {
          games: {
            orderBy: {
              game: {
                startAt: 'asc',
              },
            },
            include: {
              game: {
                select: {
                  char: true,
                  isWin: true,
                },
              },
            },
          },
        },
      })

      return streaks
    },
  )
}

const startBackFillQueue = async () => {
  logger('Starting backfilling streaks for players without streaks')

  const players = await prisma.player.findMany({
    where: {
      isBot: false,
      streaks: {
        none: {},
      },
    },
    select: {
      id: true,
    },
    take: 1000,
  })

  for (const player of players) {
    streakQueue.add(() => calculateStreaksForPlayer(player.id))
  }

  if (players.length > 0) {
    streakQueue.once('idle', () => {
      logger(`Finished backfilling streaks for ${players.length} players, checking for more`)
      startBackFillQueue()
    })
  } else {
    logger('No players without streaks found, stopping backfill')
  }
}

const calculateStreaksForPlayer = async (playerId: string) => {
  const streakData = await getStreaksByPlayer({ id: playerId })

  logger(
    `Calculating streaks for player ${playerId}, found ${streakData.streaksWithMetadata.length} streaks`,
  )

  await prisma.$transaction(async (tx) => {
    await tx.streakGame.deleteMany({
      where: {
        streak: {
          playerId,
        },
      },
    })

    await tx.streak.deleteMany({
      where: {
        playerId,
      },
    })

    if (streakData.streaksWithMetadata.length === 0) {
      await tx.streak.create({
        data: {
          playerId,
          startedAt: new Date(),
          endedAt: new Date(),
          length: 0,
          isBroken: true,
          isUniqueByChar: false,
        },
      })
    }

    for (const streaksWithMetadata of streakData.streaksWithMetadata) {
      const streakGames = streaksWithMetadata.games
      const firstGame = streakGames[0]
      const lastGame = streakGames[streakGames.length - 1]

      if (!firstGame || !lastGame) {
        throw new Error(`Streak has no games, should not happen, playerId: ${playerId}`)
      }

      await tx.streak.create({
        data: {
          playerId,
          startedAt: firstGame.endAt,
          endedAt: lastGame.endAt,
          length: streakGames.filter((x) => x.isWin).length,
          isBroken: !lastGame.isWin,
          isUniqueByChar: streaksWithMetadata.isUniqueByChar,
          games: {
            createMany: {
              data: streakGames.map((game) => ({
                id: game.id,
                gameId: game.id,
              })),
            },
          },
        },
      })
    }
  })
}
