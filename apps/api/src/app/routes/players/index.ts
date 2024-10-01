import { first, groupBy, omit, transform } from 'lodash-es'
import { AppType } from '~/app/app'
import { cache, ttl } from '~/app/cache'
import { draconians, LIMIT } from '~/app/constants'
import { findGamesIncludeServer } from '~/app/getters/findGamesIncludeServer'
import { getAggregatedPlayerStats } from '~/app/getters/getAggregatedPlayerStats'
import { getMatrix } from '~/app/getters/getMatrix'
import { getStaticData } from '~/app/getters/getStaticData'
import { getStreaks } from '~/app/getters/getStreaks'
import { prisma } from '~/prisma'

export const playersRoute = (app: AppType) => {
  app.get<{
    Querystring: {
      query?: string
    }
  }>('/api/players', async (request) => {
    const { query } = request.query

    const data = await prisma.player.findMany({
      where: { id: { contains: query?.toLowerCase() } },
      take: LIMIT,
    })

    return {
      data,
    }
  })

  app.get<{
    Params: {
      slug: string
    }
    Querystring: {
      type?: 'minimal'
      noCache?: string
      clearData?: string
    }
  }>('/api/players/:slug', async (request, reply) => {
    const { slug } = request.params
    const cacheKey = request.url.toLowerCase()
    const cached = request.query.noCache === undefined ? cache.get(cacheKey) : false

    if (request.query.clearData !== undefined) {
      getStaticData.cache.clear?.()
    }

    const getDataMinimal = async () => {
      const player = await prisma.player.findUnique({
        where: { id: slug.toLowerCase() },
      })

      if (!player) {
        return null
      }

      const [games, wins] = await Promise.all([
        prisma.game.count({
          where: { playerId: player.id },
        }),
        prisma.game.count({
          where: { playerId: player.id, isWin: true },
        }),
      ])

      return {
        games,
        wins,
        name: player.name,
      }
    }

    const getDataFull = async () => {
      const player = await prisma.player.findUnique({
        where: { id: slug.toLowerCase() },
      })

      if (!player) {
        return null
      }

      const [{ races, classes, gods }, games, firstGames, lastGames, stats, lowestXlWins, streaks] =
        await Promise.all([
          getStaticData(),
          prisma.game.findMany({
            where: { playerId: player.id },
            orderBy: { startAt: 'asc' },
          }),
          findGamesIncludeServer({
            where: { playerId: player.id },
            take: 1,
            orderBy: { startAt: 'asc' },
          }),
          findGamesIncludeServer({
            where: { playerId: player.id },
            take: LIMIT,
            orderBy: { startAt: 'desc' },
          }),
          getAggregatedPlayerStats(player),
          findGamesIncludeServer({
            where: { playerId: player.id, isWin: true },
            take: 1,
            orderBy: [{ xl: 'asc' }, { endAt: 'asc' }],
          }),
          getStreaks(player),
        ])

      const wins = games.filter((x) => x.isWin)
      const firstWin = wins[0]
      const gamesBeforeFirstWin = firstWin ? games.indexOf(firstWin) : 0
      const winsByGodName = groupBy(wins, (g) => g.god)
      const gamesByGodName = groupBy(games, (g) => g.god)

      const lastGame = first(lastGames)
      const currentStreakGroup = lastGame?.isWin
        ? streaks.streaks.find((group) => group.some((g) => g.id === lastGame.id))
        : []

      const tiamat = new Set(draconians)

      wins.forEach((game) => {
        if (tiamat.has(game.race)) {
          tiamat.delete(game.race)
        }
      })

      const gamesByRace = groupBy(games, (g) => g.race)

      return {
        player,
        stats,
        streaks: {
          ...omit(streaks, 'streaks'),
          current: currentStreakGroup?.length ?? 0,
        },
        races,
        classes,
        titlesCount: transform(
          groupBy(wins, (g) => g.title),
          (result, value, key) => (result[key] = value.length),
          {} as Record<string, number>,
        ),
        firstGame: first(firstGames),
        firstWin,
        lastGames,
        gamesBeforeFirstWin,
        lowestXlWin: lowestXlWins[0] || null,
        diedWithRunes: games.filter((game) => !game.isWin && game.runes > 0).length,
        ...getMatrix(games),
        gods: gods.map((god) => ({
          ...god,
          win: Boolean(winsByGodName[god.name]),
          wins: winsByGodName[god.name]?.length ?? 0,
          games: gamesByGodName[god.name]?.length ?? 0,
          gamesToFirstWin: (gamesByGodName[god.name] ?? []).findIndex((g) => g.isWin) + 1,
        })),
        tiamat: {
          total: draconians.length,
          unwon: Array.from(tiamat),
          detailed: draconians.map((name) => {
            const games = gamesByRace[name] || []

            return {
              name,
              games: games.length,
              wins: games.filter((g) => g.isWin).length,
              gamesToFirstWin: games.findIndex((g) => g.isWin) + 1,
            }
          }),
        },
      }
    }

    const getData = request.query.type === 'minimal' ? getDataMinimal : getDataFull
    const ttl = 1000 * 60 * (request.query.type === 'minimal' ? 60 * 12 : 5)

    if (!cached || Date.now() - cached.ttl > ttl) {
      cache.set(cacheKey, { promise: getData(), ttl: Date.now() })
    }

    return cache.get(cacheKey)?.promise.then((data: unknown) => {
      return data || reply.status(404).send('Not found')
    })
  })

  app.get<{
    Params: {
      slug: string
    }
    Querystring: {
      noCache?: string
    }
  }>('/api/players/:slug/streaks', async (request, reply) => {
    const { slug } = request.params
    const cacheKey = request.url.toLowerCase()

    const cached = request.query.noCache === undefined ? cache.get(cacheKey) : false

    const getData = async () => {
      const player = await prisma.player.findFirst({
        where: { id: slug.toLowerCase() },
      })

      if (!player) {
        return null
      }

      const [streaks] = await Promise.all([getStreaks(player)])

      return {
        streaks,
      }
    }

    if (!cached || Date.now() - cached.ttl > ttl) {
      cache.set(cacheKey, { promise: getData(), ttl: Date.now() })
    }

    return cache.get(cacheKey)?.promise.then((data: ReturnType<typeof getData>) => {
      return data || reply.status(404).send('Not found')
    })
  })

  app.get<{
    Params: {
      slug: string
    }
    Querystring: {
      from?: string
      noCache?: string
    }
  }>('/api/players/:slug/calendar', async (request, reply) => {
    const { slug } = request.params
    const cacheKey = request.url.toLowerCase()
    const cached = request.query.noCache === undefined ? cache.get(cacheKey) : false

    const getData = async () => {
      const player = await prisma.player.findUnique({
        where: { id: slug.toLowerCase() },
      })

      if (!player) {
        return null
      }

      const [games] = await Promise.all([
        prisma.game.findMany({
          where: {
            playerId: player.id,
            endAt: { gte: request.query.from },
          },
          orderBy: { endAt: 'asc' },
          select: {
            isWin: true,
            endAt: true,
          },
        }),
      ])

      return {
        games,
      }
    }

    if (!cached || Date.now() - cached.ttl > ttl) {
      cache.set(cacheKey, { promise: getData(), ttl: Date.now() })
    }

    return cache.get(cacheKey)?.promise.then((data: unknown) => {
      return data || reply.status(404).send('Not found')
    })
  })
}
