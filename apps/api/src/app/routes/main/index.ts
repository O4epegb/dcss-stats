import { AppType } from '~/app/app'
import { cache, ttl } from '~/app/cache'
import { findGamesIncludeServer } from '~/app/getters/findGamesIncludeServer'

const LIMIT = 10

export const mainRoute = (app: AppType) => {
  app.get<{
    Querystring: {
      noCache?: string
    }
  }>('/api/main', async (request) => {
    const cacheKey = request.routeOptions.url ?? request.url
    const cached = request.query.noCache === undefined ? cache.get(cacheKey) : false

    const getData = async () => {
      const top = await getTopGamesStats()

      return {
        data: {
          ...top,
        },
      }
    }

    if (!cached || Date.now() - cached.ttl > ttl) {
      cache.set(cacheKey, { promise: getData(), ttl: Date.now() })
    }

    return cache.get(cacheKey)?.promise
  })
}

export const getTopGamesStats = async () => {
  const [
    gamesByEndAt,
    gamesByTC,
    gamesByDuration,
    gamesByScore,
    gamesByTC15Runes,
    gamesByDuration15Runes,
    gamesByScore3Runes,
  ] = await Promise.all([
    findGamesIncludeServer({
      where: { isWin: true, player: { isBot: false } },
      orderBy: { endAt: 'desc' },
      take: LIMIT,
    }),
    findGamesIncludeServer({
      where: { isWin: true, player: { isBot: false } },
      orderBy: { turns: 'asc' },
      take: LIMIT,
    }),
    findGamesIncludeServer({
      where: { isWin: true, player: { isBot: false } },
      orderBy: { duration: 'asc' },
      take: LIMIT,
    }),
    findGamesIncludeServer({
      where: { isWin: true, player: { isBot: false } },
      orderBy: { score: 'desc' },
      take: LIMIT,
    }),
    findGamesIncludeServer({
      where: { isWin: true, runes: 15, player: { isBot: false } },
      orderBy: { turns: 'asc' },
      take: LIMIT,
    }),
    findGamesIncludeServer({
      where: { isWin: true, runes: 15, player: { isBot: false } },
      orderBy: { duration: 'asc' },
      take: LIMIT,
    }),
    findGamesIncludeServer({
      where: { isWin: true, runes: 3, player: { isBot: false } },
      orderBy: { score: 'desc' },
      take: LIMIT,
    }),
  ])

  return {
    gamesByEndAt,
    gamesByTC,
    gamesByDuration,
    gamesByScore,
    gamesByTC15Runes,
    gamesByDuration15Runes,
    gamesByScore3Runes,
  }
}
