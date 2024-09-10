import { orderBy, map, uniq } from 'lodash-es'
import { prisma } from '~/prisma'
import { findGamesIncludeServer } from './findGamesIncludeServer'

const LIMIT = 10

export const getTopStats = async () => {
  const [titles, winrates, winners, gamesByTC, gamesByDuration, gamesByScore] = await Promise.all([
    prisma.game
      .groupBy({
        by: ['title', 'playerId'],
        where: { isWin: true },
      })
      .then((data) => {
        const byPlayerId = data.reduce(
          (acc, { playerId, title }) => {
            if (!acc[playerId]) {
              acc[playerId] = []
            }

            acc[playerId].push(title)

            return acc
          },
          {} as Record<string, string[]>,
        )

        return orderBy(
          map(byPlayerId, (titles, playerId) => {
            return {
              playerId,
              titles: uniq(titles).length,
            }
          }),
          (x) => x.titles,
          'desc',
        ).slice(0, 10)
      }),
    prisma.$queryRaw<Array<{ playerId: string; winrate: number }>>`
      SELECT "playerId"
        , 1.0 * SUM(CASE WHEN "isWin" THEN 1 ELSE 0 END) / COUNT("playerId") AS winrate
      FROM "Game"
      GROUP BY "playerId"
      HAVING COUNT("playerId") >= 75
      ORDER BY winrate DESC
      LIMIT 10
`,
    prisma.game.groupBy({
      by: ['playerId'],
      where: { isWin: true },
      _count: { isWin: true },
      orderBy: { _count: { isWin: 'desc' } },
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
  ])

  const players = await prisma.player.findMany({
    where: {
      id: {
        in: uniq([...titles, ...winrates, ...winners].map((x) => x.playerId)),
      },
    },
  })

  return {
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
    gamesByTC,
    gamesByDuration,
    gamesByScore,
  }
}
