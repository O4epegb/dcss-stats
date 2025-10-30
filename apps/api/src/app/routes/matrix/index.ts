import { Prisma } from '@prisma/client'
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
        const groupBy: Prisma.GameScalarFieldEnum[] = ['char', 'god']

        const where = await getWhereQueryFromFilter(filter)
        const [gamesGrouped, winsGrouped] = await Promise.all([
          prisma.game.groupBy({
            by: groupBy,
            where: { ...where, versionShort },
            _count: { _all: true },
          }),
          prisma.game.groupBy({
            by: groupBy,
            where: { ...where, versionShort, isWin: true },
            _count: { _all: true },
          }),
        ])

        const winsByKey = new Map(
          winsGrouped.map((item) => [groupBy.map((key) => item[key]).join(','), item._count._all]),
        )

        const matrix = gamesGrouped.reduce(
          (acc, item) => {
            const key = item.char + (item.god ? ',' + item.god : '')
            const accItem = acc[key] ?? [0, 0]

            const wins = winsByKey.get(key) ?? 0

            accItem[0] += item._count._all
            accItem[1] += wins

            acc[key] = accItem

            return acc
          },
          {} as Record<string, [number, number]>,
        )

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
