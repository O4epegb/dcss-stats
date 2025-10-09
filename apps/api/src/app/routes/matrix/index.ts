import { Static, Type } from 'typebox'
import { AppType } from '~/app/app'
import { cache, ttl } from '~/app/cache'
import { getStaticData } from '~/app/getters/getStaticData'
import { filterQuerystringPart, getWhereQueryFromFilter } from '~/app/routes/search'
import { prisma } from '~/prisma'

export const matrixRoute = (app: AppType) => {
  const querystringSchema = Type.Object({
    race: Type.Optional(Type.String()),
    class: Type.Optional(Type.String()),
    god: Type.Optional(Type.String()),
    version: Type.Optional(Type.String()),
    noCache: Type.Optional(Type.Boolean()),
    filter: filterQuerystringPart,
  })
  type QuerystringType = Static<typeof querystringSchema>

  app.get<{ Querystring: QuerystringType }>(
    '/api/matrix',
    { schema: { querystring: querystringSchema } },
    async (request) => {
      const { version, filter = [] } = request.query

      const { versions } = await getStaticData()

      const versionShort = versions.find((v) => v === version) ?? versions[0]

      const cacheKey = request.url.toLowerCase()
      const cached = request.query.noCache ? false : cache.get(cacheKey)

      const getData = async () => {
        const where = await getWhereQueryFromFilter(filter)
        const [gamesByChar, winsByChar] = await Promise.all([
          prisma.game.groupBy({
            by: ['char'],
            where: { ...where, versionShort },
            _count: { _all: true },
          }),
          prisma.game.groupBy({
            by: ['char'],
            where: { ...where, versionShort, isWin: true },
            _count: { _all: true },
          }),
        ])

        const matrix = gamesByChar.map((game) => {
          const games = game._count._all
          const wins = winsByChar.find((x) => x.char === game.char)?._count._all ?? 0
          const winrate = Math.round((wins / games) * 100) / 100

          return {
            char: game.char,
            games,
            wins,
            winrate,
          }
        })

        return {
          matrix,
        }
      }

      if (!cached || Date.now() - cached.ttl > ttl) {
        cache.set(cacheKey, { promise: getData(), ttl: Date.now() })
      }

      return cache.get(cacheKey)?.promise
    },
  )
}
