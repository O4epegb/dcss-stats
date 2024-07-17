import dayjs from 'dayjs'
import { prisma } from '~/prisma'
import { AppType } from '~/app/app'
import { cache, ttl } from '~/app/cache'
import { getStaticData, getTopStats, getCombosData } from '../../getters'

export const statsRoute = (app: AppType) => {
  app.get<{
    Querystring: {
      noCache?: string
    }
  }>('/api/stats', async (request) => {
    const cacheKey = request.routeOptions.url ?? request.url
    const cached = request.query.noCache === undefined ? cache.get(cacheKey) : false

    const getData = async () => {
      const [races, classes, gods, versions] = await getStaticData()

      const [games, wins, combosData] = await Promise.all([
        prisma.game.count(),
        prisma.game.count({ where: { isWin: true } }),
        getCombosData({
          where: {
            versionShort: versions[0],
            startAt: { gte: dayjs().subtract(7, 'days').startOf('day').toDate() },
          },
          take: 100000,
        }),
      ])

      const top = await getTopStats()

      return {
        data: {
          games,
          wins,
          top,
          combosData,
          races,
          classes,
          gods,
        },
      }
    }

    if (!cached || Date.now() - cached.ttl > ttl) {
      cache.set(cacheKey, { promise: getData(), ttl: Date.now() })
    }

    return cache.get(cacheKey)?.promise
  })
}
