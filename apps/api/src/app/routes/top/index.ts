import { Prisma } from '@prisma/client'
import { Type, Static } from '@sinclair/typebox'
import { uniq } from 'lodash-es'
import { AppType } from '~/app/app'
import { cache, ttl } from '~/app/cache'

import { prisma } from '~/prisma'

const LIMIT = 10

export const topRoute = (app: AppType) => {
  const Querystring = Type.Object({
    noCache: Type.Optional(Type.String()),
    since: Type.Optional(Type.String({ format: 'date-time' })),
  })

  app.get<{
    Querystring: Static<typeof Querystring>
  }>('/api/top', { schema: { querystring: Querystring } }, async (request) => {
    const cacheKey = request.url.toLowerCase()
    const cached = request.query.noCache === undefined ? cache.get(cacheKey) : false

    const getData = async () => {
      const top = await getTopStats(request.query.since ? new Date(request.query.since) : undefined)

      return {
        data: top,
      }
    }

    if (!cached || Date.now() - cached.ttl > ttl) {
      cache.set(cacheKey, { promise: getData(), ttl: Date.now() })
    }

    return cache.get(cacheKey)?.promise
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

const getTopWinrates = async (since?: Date) => {
  return prisma.$queryRaw<Array<{ playerId: string; winrate: number }>>`
    SELECT "playerId",
           1.0 * SUM(CASE WHEN "isWin" THEN 1 ELSE 0 END) / COUNT("playerId") AS winrate
    FROM "Game"
    ${since ? Prisma.sql`WHERE "endAt" >= ${since}` : Prisma.sql``}
    GROUP BY "playerId"
    HAVING COUNT("playerId") >= 75
    ORDER BY winrate DESC
    LIMIT ${LIMIT};
  `
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

const getTopStats = async (since?: Date) => {
  const [titles, winrates, winners, gamesTotal, winsTotal] = await Promise.all([
    getTopTitles(since),
    getTopWinrates(since),
    getTopWinners(since),
    prisma.$queryRaw<[{ count: bigint }]>`
    SELECT COUNT(*) as count FROM "Game"
    ${since ? Prisma.sql`WHERE "endAt" >= ${since}` : Prisma.sql``}
    `.then((result) => Number(result[0].count)),
    prisma.game.count({ where: { isWin: true, ...(since ? { endAt: { gte: since } } : {}) } }),
  ])

  const players = await prisma.player.findMany({
    where: {
      id: {
        in: uniq([...titles, ...winrates, ...winners].map((x) => x.playerId)),
      },
    },
  })

  return {
    gamesTotal,
    winsTotal,
    byWinrate: winrates.map(({ playerId, winrate }) => ({
      winrate,
      name: players.find((x) => x.id === playerId)?.name,
    })),
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
