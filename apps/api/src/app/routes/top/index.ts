import { uniq } from 'lodash-es'
import { Static, Type } from 'typebox'
import { AppType } from '~/app/app'
import { createCache, getRouteCacheKey, type CacheManager } from '~/app/cache'
import { Prisma } from '~/generated/prisma/client/client'
import { prisma } from '~/prisma'

const LIMIT = 10

export const topRoute = (
  app: AppType,
  { cache = createCache({ revalidate: Infinity, expire: 300 }) }: { cache?: CacheManager } = {},
) => {
  const Querystring = Type.Object({
    noCache: Type.Optional(Type.String()),
    since: Type.Optional(Type.String({ format: 'date-time' })),
    minGamesThresholdForWinrate: Type.Number({ minimum: 0, default: 75 }),
  })

  app.get<{
    Querystring: Static<typeof Querystring>
  }>('/api/top', { schema: { querystring: Querystring } }, async (request) => {
    const { minGamesThresholdForWinrate, noCache } = request.query
    const since = request.query.since ? new Date(request.query.since) : undefined
    const period = { since: since?.toISOString() }
    const skipCache = noCache !== undefined

    const [common, byWinrate] = await Promise.all([
      cache.get({
        key: getRouteCacheKey('/api/top/common', period),
        loader: () => getCommonTopStats(since),
        skipCache,
      }),
      cache.get({
        key: getRouteCacheKey('/api/top/winrates', { ...period, minGamesThresholdForWinrate }),
        loader: () => getTopWinrates(minGamesThresholdForWinrate, since),
        skipCache,
      }),
    ])

    return {
      data: {
        minGamesThresholdForWinrate,
        ...common,
        byWinrate,
      },
    }
  })
}

const getTopTitles = async (since?: Date) => {
  return prisma.$queryRaw<Array<{ playerId: string; titles: number }>>`
    SELECT "playerId", CAST(COUNT(DISTINCT "title") AS INTEGER) AS titles
    FROM "Game"
    WHERE "isWin" = TRUE ${since ? Prisma.sql`AND "endAt" >= ${since}` : Prisma.sql``}
    GROUP BY "playerId"
    ORDER BY titles DESC
    LIMIT ${LIMIT};
  `
}

const getTopWinrates = async (minGamesThresholdForWinrate: number, since?: Date) => {
  const winrates = await prisma.$queryRaw<
    Array<{ playerId: string; winrate: number; games: number }>
  >`
    SELECT "playerId",
           CAST(COUNT("playerId") AS INTEGER) AS games,
           1.0 * SUM(CASE WHEN "isWin" THEN 1 ELSE 0 END) / COUNT("playerId") AS winrate
    FROM "Game"
    ${since ? Prisma.sql`WHERE "endAt" >= ${since}` : Prisma.sql``}
    GROUP BY "playerId"
    HAVING COUNT("playerId") >= ${minGamesThresholdForWinrate}
    ORDER BY winrate DESC
    LIMIT ${LIMIT};
  `

  const players = await prisma.player.findMany({
    where: { id: { in: winrates.map((row) => row.playerId) } },
  })

  return winrates.map(({ playerId, winrate, games }) => ({
    winrate,
    games,
    name: players.find((player) => player.id === playerId)?.name,
  }))
}

const getTopWinners = async (since?: Date) => {
  return prisma.game.groupBy({
    by: ['playerId'],
    where: { isWin: true, ...(since ? { endAt: { gte: since } } : {}) },
    _count: { isWin: true },
    orderBy: { _count: { isWin: 'desc' } },
    take: LIMIT,
  })
}

const getCommonTopStats = async (since?: Date) => {
  const [titles, winners, gamesTotal, winsTotal] = await Promise.all([
    getTopTitles(since),
    getTopWinners(since),
    // At the time of writing, prisma.game.count() is much slower than the raw query for unknown reason
    prisma.$queryRaw<[{ count: bigint }]>`
    SELECT COUNT(*) as count FROM "Game"
    ${since ? Prisma.sql`WHERE "endAt" >= ${since}` : Prisma.sql``}
    `.then((result) => Number(result[0].count)),
    prisma.game.count({ where: { isWin: true, ...(since ? { endAt: { gte: since } } : {}) } }),
  ])

  const players = await prisma.player.findMany({
    where: {
      id: {
        in: uniq([...titles, ...winners].map((x) => x.playerId)),
      },
    },
  })

  return {
    gamesTotal,
    winsTotal,
    byWins: winners.map(({ playerId, _count }) => ({
      name: players.find((x) => x.id === playerId)?.name,
      wins: _count.isWin,
    })),
    byTitles: titles.map(({ playerId, titles }) => ({
      titles,
      name: players.find((p) => p.id === playerId)?.name ?? playerId,
    })),
  }
}
