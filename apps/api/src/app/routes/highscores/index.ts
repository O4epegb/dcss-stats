import { CronJob } from 'cron'
import Type from 'typebox'
import { AppType } from '~/app'
import { createCache, type CacheManager } from '~/app/cache'
import { getHighscores } from '~/app/getters/getHighscores'
import { getCombinedLeaderboard, getLeaderboard, getTopRecords } from '~/app/getters/getLeaderboard'
import {
  HighscoreBreakdown,
  HighscoreKind,
  HighscoreRuneTier,
  Prisma,
} from '~/generated/prisma/client/client'
import { prisma } from '~/prisma'
import { logger } from '~/utils'

let isRecalculating = false

const recalcHighscores = async () => {
  if (isRecalculating) {
    logger('Highscores recalculation already in progress, skipping')
    return
  }

  isRecalculating = true

  try {
    logger('Starting highscores recalculation')

    const kinds: HighscoreKind[] = ['HIGHSCORE', 'TURN_COUNT', 'DURATION']

    let totalEntries = 0

    for (const kind of kinds) {
      const data = await getHighscores(kind)

      for (const { breakdown, runeTier, rows } of data) {
        totalEntries += rows.length

        await prisma.$transaction(
          async (tx) => {
            await tx.highscore.deleteMany({
              where: { kind, breakdown, runeTier },
            })

            const batchSize = 10000
            for (let i = 0; i < rows.length; i += batchSize) {
              const batch = rows.slice(i, i + batchSize)
              await tx.highscore.createMany({
                data: batch.map((row) => ({
                  gameId: row.gameId,
                  playerId: row.playerId,
                  kind,
                  breakdown,
                  runeTier,
                  normalizedClass: row.normalizedClass,
                  normalizedRace: row.normalizedRace,
                  char: row.char,
                  score: row.score,
                  turns: row.turns,
                  duration: row.duration,
                  runes: row.runes,
                  rank: row.rank,
                  points: row.points,
                })),
              })
            }
          },
          { timeout: 300_000 },
        )
      }
    }

    logger(`Finished highscores recalculation, ${totalEntries} entries`)
  } catch (err) {
    logger(`Highscores recalculation failed: ${err}`)
  } finally {
    isRecalculating = false
  }
}

const highscoresCronJob = CronJob.from({
  cronTime: '0 4 * * *',
  onTick: async () => {
    await recalcHighscores()
  },
})

type HighscoresRouteOptions = {
  cache?: CacheManager
}

export const highscoresRoute = (
  app: AppType,
  { cache = createCache() }: HighscoresRouteOptions = {},
) => {
  highscoresCronJob.start()

  app.get('/api/highscores/recalc', async (_request, reply) => {
    if (isRecalculating) {
      return reply.status(409).send({ message: 'Highscores recalculation already in progress' })
    }

    recalcHighscores()

    return {
      message: 'Started highscores recalculation',
    }
  })

  app.get('/api/highscores/meta', async () => {
    const count = await prisma.highscore.count()

    return {
      count,
      cron: {
        isActive: highscoresCronJob.isActive,
        isCallbackRunning: highscoresCronJob.isCallbackRunning,
        lastExecution: highscoresCronJob.lastExecution,
        nextExecution: highscoresCronJob.nextDates(5),
      },
    }
  })

  const Querystring = Type.Object({
    noCache: Type.Optional(Type.String()),
    kind: Type.Optional(Type.Enum(HighscoreKind)),
    breakdown: Type.Optional(Type.Enum(HighscoreBreakdown)),
    runeTier: Type.Optional(Type.Enum(HighscoreRuneTier)),
    key: Type.Optional(Type.String()),
    player: Type.Optional(Type.String()),
    skip: Type.Number({ default: 0 }),
    take: Type.Number({ default: 100 }),
  })

  app.get(
    '/api/highscores',
    {
      schema: {
        querystring: Querystring,
      },
    },
    async (request) => {
      return cache.get({
        key: request.url,
        skipCache: request.query.noCache !== undefined,
        loader: async () => {
          const where: Prisma.HighscoreWhereInput = {}

          if (request.query.kind) {
            where.kind = request.query.kind
          }
          if (request.query.breakdown) {
            where.breakdown = request.query.breakdown
          }
          if (request.query.runeTier) {
            where.runeTier = request.query.runeTier
          }
          if (request.query.key) {
            where.OR = [
              { normalizedClass: request.query.key },
              { normalizedRace: request.query.key },
              { char: request.query.key },
            ]
          }
          if (request.query.player) {
            where.playerId = request.query.player.toLowerCase()
          }

          const { skip, take } = request.query

          const [highscores, total] = await Promise.all([
            prisma.highscore.findMany({
              where,
              orderBy:
                request.query.kind === 'DURATION'
                  ? { duration: 'asc' }
                  : request.query.kind === 'TURN_COUNT'
                    ? { turns: 'asc' }
                    : { score: 'desc' },
              skip,
              take,
              include: {
                player: true,
                game: {
                  include: {
                    logfile: {
                      include: {
                        server: true,
                      },
                    },
                  },
                },
              },
            }),
            prisma.highscore.count({ where }),
          ])

          return {
            data: highscores.map(({ game, ...rest }) => ({
              ...rest,
              game: {
                ...game,
                server: {
                  ...game.logfile.server,
                  morgueUrl: game.logfile.server.morgueUrl + (game.logfile.morgueUrlPrefix ?? ''),
                },
              },
            })),
            total,
            skip,
            take,
          }
        },
      })
    },
  )

  const LeaderboardQuerystring = Type.Object({
    kind: Type.Optional(Type.String()),
    runeTier: Type.Optional(Type.Enum(HighscoreRuneTier)),
    search: Type.Optional(Type.String()),
    skip: Type.Number({ default: 0 }),
    take: Type.Number({ default: 25 }),
  })

  app.get(
    '/api/highscores/leaderboard',
    {
      schema: {
        querystring: LeaderboardQuerystring,
      },
    },
    async (request) => {
      const kind = request.query.kind ?? 'combined'
      const { skip, take, runeTier } = request.query
      const search = request.query.search?.toLowerCase()

      if (kind === 'combined') {
        const allEntries = await getCombinedLeaderboard(runeTier)
        const filtered = search
          ? allEntries.filter((e) => e.playerName.toLowerCase().includes(search))
          : allEntries

        return {
          data: filtered.slice(skip, skip + take),
          total: filtered.length,
          skip,
          take,
        }
      }

      const allEntries = await getLeaderboard(kind as HighscoreKind, runeTier)
      const filtered = search
        ? allEntries.filter((e) => e.playerName.toLowerCase().includes(search))
        : allEntries

      return {
        data: filtered.slice(skip, skip + take),
        total: filtered.length,
        skip,
        take,
      }
    },
  )

  const RecordsQuerystring = Type.Object({
    kind: Type.Optional(Type.Enum(HighscoreKind)),
    runeTier: Type.Optional(Type.Enum(HighscoreRuneTier)),
    search: Type.Optional(Type.String()),
    skip: Type.Number({ default: 0 }),
    take: Type.Number({ default: 25 }),
  })

  app.get(
    '/api/highscores/records',
    {
      schema: {
        querystring: RecordsQuerystring,
      },
    },
    async (request) => {
      const kind = request.query.kind ?? 'HIGHSCORE'
      const { skip, take, runeTier } = request.query
      const search = request.query.search?.toLowerCase()

      const allEntries = await getTopRecords(kind, runeTier)

      const filtered = search
        ? allEntries.filter((e) => e.playerName.toLowerCase().includes(search))
        : allEntries

      return {
        data: filtered.slice(skip, skip + take),
        total: filtered.length,
        skip,
        take,
      }
    },
  )
}
