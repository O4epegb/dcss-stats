import { AppType } from '~/app/app'
import { createCache, type CacheManager } from '~/app/cache'
import { findGamesIncludeServer } from '~/app/getters/findGamesIncludeServer'

const LIMIT = 10

export const mainRoute = (
  app: AppType,
  { cache = createCache({ revalidate: Infinity, expire: 300 }) }: { cache?: CacheManager } = {},
) => {
  app.get<{
    Querystring: {
      noCache?: string
    }
  }>('/api/main', async (request) => {
    const cacheKey = request.routeOptions.url ?? request.url

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

    return cache.get({
      key: cacheKey,
      loader: getData,
      skipCache: request.query.noCache !== undefined,
    })
  })
}
