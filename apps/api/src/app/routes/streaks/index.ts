import { StreakType } from '@prisma/client'
import { CronJob } from 'cron'
import dayjs from 'dayjs'
import { uniq } from 'lodash-es'
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

    const streaksWithNoRelatedGames = await prisma.streak.findMany({
      where: {
        games: {
          none: {},
        },
        length: {
          gt: 0,
        },
      },
      select: {
        playerId: true,
      },
      take: 1000,
    })

    for (const playerId of uniq([
      ...players.map((p) => p.id),
      ...streaksWithNoRelatedGames.map((s) => s.playerId),
    ])) {
      streakQueue.add(() => calculateStreaksForPlayer(playerId))
    }

    streakQueue.once('idle', () => {
      startBackFillQueue()
    })
  },
})

export const streaksRoute = async (app: AppType) => {
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
        type: 'UNIQUE',
      },
    })
    const monoCharStreaks = await prisma.streak.count({
      where: {
        type: 'MONO',
      },
    })
    const streaksWithGames = await prisma.streak.count({
      where: {
        games: {
          some: {},
        },
      },
    })

    return {
      queueSize: streakQueue.size,
      queueStatus: streakQueue.isPaused ? 'paused' : 'running',
      totalStreaks,
      streaksWithGames,
      uniqueCharStreaks,
      monoCharStreaks,
      playersWithStreaks,
      playersWithoutStreaks,
    }
  })

  const Querystring = Type.Object({
    isBroken: Type.Optional(Type.Boolean()),
    type: Type.Optional(Type.Enum(StreakType)),
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
          type: request.query.type,
          length: {
            gt: 0,
          },
        },
        include: {
          player: true,
          games: {
            orderBy: {
              game: {
                startAt: 'asc',
              },
            },
            select: {
              gameId: true,
              game: {
                select: {
                  char: true,
                  isWin: true,
                  endAt: true,
                },
              },
            },
          },
        },
      })

      return {
        data: streaks,
      }
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
          type: StreakType.MIXED,
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
          startedAt: firstGame.startAt,
          endedAt: lastGame.isWin ? undefined : lastGame.endAt,
          length: streakGames.filter((x) => x.isWin).length,
          isBroken: !lastGame.isWin,
          type: streaksWithMetadata.type,
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
