import { Prisma } from '@prisma/client'
import { castArray } from 'lodash-es'
import { Static, Type } from 'typebox'
import { AppType } from '~/app/app'
import { LIMIT } from '~/app/constants'
import { findGamesIncludeServer } from '~/app/getters/findGamesIncludeServer'
import { getVersionIntegerFromString } from '~/parser/utils'
import { prisma } from '~/prisma'

export const gamesRoute = (app: AppType) => {
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
    includePlayer: Type.Optional(Type.Boolean()),
    runes: Type.Optional(Type.Union([Type.Array(Type.Number()), Type.Number()])),
    orderBy: Type.Optional(Type.Union([Type.Literal('startAt'), Type.Literal('endAt')])),
  })

  app.get<{
    Querystring: Static<typeof GamesQuerystring>
  }>(
    '/api/games',
    {
      schema: {
        querystring: GamesQuerystring,
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
            orderBy: { [orderBy]: 'desc' },
          },
          includePlayer,
        ),
      ])

      return {
        count,
        data,
      }
    },
  )

  app.get<{
    Params: {
      id: string
    }
  }>('/api/games/:id', async (request, reply) => {
    const [game] = await findGamesIncludeServer({
      where: { id: request.params.id },
    })

    if (!game) {
      return reply.status(404).send('Not found')
    }

    return game
  })
}
