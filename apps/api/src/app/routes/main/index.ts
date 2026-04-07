import { AppType } from '~/app/app'
import { legacyCache, ttl } from '~/app/cache'
import { findGamesIncludeServer } from '~/app/getters/findGamesIncludeServer'

const LIMIT = 10

export const mainRoute = (app: AppType) => {
  app.get<{
    Querystring: {
      noCache?: string
    }
  }>('/api/main', async (request) => {
    const cacheKey = request.routeOptions.url ?? request.url
    const cached = request.query.noCache === undefined ? legacyCache.get(cacheKey) : false

    const getData = async () => {
      const gamesByEndAt = await findGamesIncludeServer({
        where: { isWin: true, player: { isBot: false } },
        orderBy: { endAt: 'desc' },
        take: LIMIT,
      })

      return {
        data: {
          gamesByEndAt,
        },
      }
    }

    if (!cached || Date.now() - cached.ttl > ttl) {
      legacyCache.set(cacheKey, { promise: getData(), ttl: Date.now() })
    }

    return legacyCache.get(cacheKey)?.promise
  })
}
