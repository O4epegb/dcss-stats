import { groupBy, orderBy } from 'lodash-es'
import { createCache } from '~/app/cache'
import { HighscoreKind, HighscoreRuneTier, Prisma } from '~/generated/prisma/client/client'
import { prisma } from '~/prisma'

export type LeaderboardEntry = {
  playerId: string
  playerName: string
  points: number
  entryCount: number
  rank: number
}

export type CombinedLeaderboardEntry = {
  playerId: string
  playerName: string
  highscorePoints: number
  turncountPoints: number
  durationPoints: number
  totalPoints: number
  rank: number
}

export type RecordsEntry = {
  playerId: string
  playerName: string
  records: number
  rank: number
  combos: Array<{
    char: string
    runeTier: HighscoreRuneTier
    value: number
  }>
}

const cache = createCache({ revalidate: 300 })

export const getLeaderboard = async (
  kind: HighscoreKind = 'HIGHSCORE',
  runeTier?: HighscoreRuneTier,
): Promise<LeaderboardEntry[]> => {
  return cache.get({
    key: `leaderboard:${kind}:${runeTier ?? 'ALL'}`,
    loader: async () => {
      const rows = await prisma.$queryRaw<
        Array<{ playerId: string; playerName: string; points: number; entryCount: number }>
      >`
        SELECT h."playerId", p.name as "playerName", 
               SUM(h.points)::int as points, 
               COUNT(*)::int as "entryCount"
        FROM "Highscore" h
        JOIN "Player" p ON p.id = h."playerId"
        WHERE h.kind = ${kind}::"HighscoreKind"
          AND h.breakdown = 'CHAR'
          AND h.rank <= 10
          AND h."runeTier" IN ('TIER_1', 'TIER_2')
          ${runeTier ? Prisma.sql`AND h."runeTier" = ${runeTier}::"HighscoreRuneTier"` : Prisma.empty}
        GROUP BY h."playerId", p.name
        ORDER BY points DESC
      `

      return rows.map((row, index) => ({ ...row, rank: index + 1 }))
    },
  })
}

export const getCombinedLeaderboard = async (
  runeTier?: HighscoreRuneTier,
): Promise<CombinedLeaderboardEntry[]> => {
  return cache.get({
    key: `leaderboard:combined:${runeTier ?? 'ALL'}`,
    loader: async () => {
      const [highscores, turncounts, durations] = await Promise.all([
        getLeaderboard('HIGHSCORE', runeTier),
        getLeaderboard('TURN_COUNT', runeTier),
        getLeaderboard('DURATION', runeTier),
      ])

      const playerMap = new Map<
        string,
        {
          playerName: string
          highscorePoints: number
          turncountPoints: number
          durationPoints: number
        }
      >()

      for (const entry of highscores) {
        const existing = playerMap.get(entry.playerId)
        if (existing) {
          existing.highscorePoints = entry.points
        } else {
          playerMap.set(entry.playerId, {
            playerName: entry.playerName,
            highscorePoints: entry.points,
            turncountPoints: 0,
            durationPoints: 0,
          })
        }
      }

      for (const entry of turncounts) {
        const existing = playerMap.get(entry.playerId)
        if (existing) {
          existing.turncountPoints = entry.points
        } else {
          playerMap.set(entry.playerId, {
            playerName: entry.playerName,
            highscorePoints: 0,
            turncountPoints: entry.points,
            durationPoints: 0,
          })
        }
      }

      for (const entry of durations) {
        const existing = playerMap.get(entry.playerId)
        if (existing) {
          existing.durationPoints = entry.points
        } else {
          playerMap.set(entry.playerId, {
            playerName: entry.playerName,
            highscorePoints: 0,
            turncountPoints: 0,
            durationPoints: entry.points,
          })
        }
      }

      const sorted = Array.from(playerMap.entries())
        .map(([playerId, data]) => ({
          playerId,
          ...data,
          totalPoints: data.highscorePoints + data.turncountPoints + data.durationPoints,
        }))
        .sort((a, b) => b.totalPoints - a.totalPoints)

      return sorted.map((entry, index) => ({ ...entry, rank: index + 1 }))
    },
  })
}

const recordsCache = createCache({ revalidate: 300 })

export const getTopRecords = async (
  kind: HighscoreKind = 'HIGHSCORE',
  runeTier?: HighscoreRuneTier,
): Promise<RecordsEntry[]> => {
  return recordsCache.get({
    key: `records:${kind}:${runeTier ?? 'ALL'}`,
    loader: async () => {
      const entries = await prisma.highscore.findMany({
        where: {
          kind,
          breakdown: 'CHAR',
          rank: 1,
          runeTier: runeTier ?? { in: ['TIER_1', 'TIER_2'] },
        },
        select: {
          playerId: true,
          player: { select: { name: true } },
          char: true,
          runeTier: true,
          score: true,
          turns: true,
          duration: true,
        },
      })

      const grouped = groupBy(entries, (e) => e.playerId)

      return orderBy(
        Object.entries(grouped).map(([playerId, group]) => ({
          playerId,
          playerName: group[0].player.name,
          records: group.length,
          rank: 0,
          combos: orderBy(
            group.map((e) => ({
              char: e.char,
              runeTier: e.runeTier,
              value: kind === 'DURATION' ? e.duration : kind === 'TURN_COUNT' ? e.turns : e.score,
            })),
            ['value'],
            [kind === 'DURATION' || kind === 'TURN_COUNT' ? 'asc' : 'desc'],
          ),
        })),
        ['records'],
        ['desc'],
      ).map((entry, index) => ({ ...entry, rank: index + 1 }))
    },
  })
}
