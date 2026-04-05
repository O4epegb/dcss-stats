import { createCache } from '~/app/cache'
import { prisma } from '~/prisma'

export type LeaderboardEntry = {
  playerId: string
  playerName: string
  points: number
  entryCount: number
  rank: number
}

const cache = createCache({ revalidate: 300 })

export const getLeaderboard = async (): Promise<LeaderboardEntry[]> => {
  return cache.get({
    key: 'leaderboard',
    loader: async () => {
      const rows = await prisma.$queryRaw<
        Array<{ playerId: string; playerName: string; points: number; entryCount: number }>
      >`
        SELECT h."playerId", p.name as "playerName", 
               SUM(h.points)::int as points, 
               COUNT(*)::int as "entryCount"
        FROM "Highscore" h
        JOIN "Player" p ON p.id = h."playerId"
        WHERE h.breakdown = 'CHAR'
          AND h.rank <= 10
          AND h."runeTier" IN ('THREE_RUNES', 'FOUR_PLUS_RUNES')
        GROUP BY h."playerId", p.name
        ORDER BY points DESC
      `

      return rows.map((row, index) => ({ ...row, rank: index + 1 }))
    },
  })
}
