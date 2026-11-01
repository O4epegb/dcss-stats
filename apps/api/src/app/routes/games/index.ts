import { castArray } from 'lodash-es'
import { Type } from 'typebox'
import { AppType } from '~/app/app'
import { LIMIT } from '~/app/constants'
import { findGamesIncludeServer } from '~/app/getters/findGamesIncludeServer'
import { ApiError } from '~/app/schemas/api-error'
import { Game } from '~/app/schemas/game'
import { schemaRef } from '~/app/schemas/ref'
import { Prisma } from '~/generated/prisma/client/client'
import { getVersionIntegerFromString } from '~/parser/utils'
import { prisma } from '~/prisma'

const GamesResponse = Type.Object(
  {
    count: Type.Integer(),
    data: Type.Array(
      Type.Intersect([
        schemaRef(Game),
        Type.Object({
          player: Type.Optional(
            Type.Object({
              id: Type.String(),
              name: Type.String(),
              isBot: Type.Boolean(),
            }),
          ),
        }),
      ]),
    ),
  },
  { $id: 'GamesResponse' },
)

export const gamesRoute = (app: AppType) => {
  app.addSchema(GamesResponse)

  const GamesQuerystring = Type.Object({
    id: Type.Optional(Type.String()),
    player: Type.Optional(Type.String()),
    after: Type.Optional(Type.String()),
    isWin: Type.Optional(Type.Boolean()),
    race: Type.Optional(Type.String()),
    class: Type.Optional(Type.String()),
    god: Type.Optional(Type.String()),
    title: Type.Optional(Type.String()),
    version: Type.Optional(Type.Array(Type.String())),
    server: Type.Optional(Type.Array(Type.String())),
    includePlayer: Type.Optional(Type.Boolean()),
    runes: Type.Optional(Type.Union([Type.Array(Type.Number()), Type.Number()])),
    orderBy: Type.Optional(Type.Union([Type.Literal('startAt'), Type.Literal('endAt')])),
  })

  app.get(
    '/api/games',
    {
      schema: {
        operationId: 'getGames',
        querystring: GamesQuerystring,
        response: {
          200: schemaRef(GamesResponse),
          400: schemaRef(ApiError),
          500: schemaRef(ApiError),
        },
      },
    },
    async (request) => {
      const {
        id,
        player,
        after,
        isWin,
        race,
        class: klass,
        god,
        title,
        version,
        server,
        runes,
        includePlayer,
        orderBy = 'startAt',
      } = request.query

      const where: Prisma.GameWhereInput = {
        id,
        playerId: player?.toLowerCase(),
        versionInteger: { in: version?.map((v) => getVersionIntegerFromString(v)) },
        isWin,
        raceAbbr: race,
        classAbbr: klass,
        god,
        title,
        runes: runes && { in: castArray(runes) },
        serverAbbreviation: server && { in: server.map((s) => s.toUpperCase()) },
      }

      const [count, data] = await Promise.all([
        prisma.game.count({
          where,
        }),
        findGamesIncludeServer(
          {
            where,
            take: LIMIT,
            skip: after ? 1 : undefined,
            cursor: after ? { id: after } : undefined,
            orderBy: [{ [orderBy]: 'desc' }, { id: 'desc' }],
          },
          includePlayer,
        ),
      ])

      return {
        count,
        data: data.map((game) => ({
          ...game,
          startAt: game.startAt.toISOString(),
          endAt: game.endAt.toISOString(),
        })),
      }
    },
  )

  app.get(
    '/api/games/:id',
    {
      schema: {
        operationId: 'getGame',
        params: Type.Object({ id: Type.String() }),
        response: {
          200: schemaRef(Game),
          404: schemaRef(ApiError),
          500: schemaRef(ApiError),
        },
      },
    },
    async (request, reply) => {
      const [game] = await findGamesIncludeServer({
        where: { id: request.params.id },
      })

      if (!game) {
        return reply.status(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: 'Game not found',
        })
      }

      return {
        ...game,
        startAt: game.startAt.toISOString(),
        endAt: game.endAt.toISOString(),
      }
    },
  )
}
