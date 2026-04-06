import {
  HighscoreBreakdown,
  HighscoreKind,
  HighscoreRuneTier,
} from '~/generated/prisma/client/client'
import { prisma } from '~/prisma'
import { logger } from '~/utils'

const LIMIT = 10

type HighscoreRow = {
  gameId: string
  playerId: string
  normalizedClass: string
  normalizedRace: string
  char: string
  score: number
  turns: number
  duration: number
  runes: number
  rank: number
  points: number
}

const partitionBy: Record<HighscoreBreakdown, string> = {
  CLASS: '"normalizedClass"',
  RACE: '"normalizedRace"',
  CHAR: '"char"',
}

const runeFilterByKind: Record<HighscoreKind, Record<string, string>> = {
  HIGHSCORE: {
    TIER_1: 'AND "runes" = 3',
    TIER_2: 'AND "runes" >= 4',
  },
  TURN_COUNT: {
    TIER_1: 'AND "runes" BETWEEN 3 AND 14',
    TIER_2: 'AND "runes" = 15',
  },
  DURATION: {
    TIER_1: 'AND "runes" BETWEEN 3 AND 14',
    TIER_2: 'AND "runes" = 15',
  },
}

const orderBy: Record<HighscoreKind, string> = {
  HIGHSCORE: 'ORDER BY score DESC',
  TURN_COUNT: 'ORDER BY turns ASC',
  DURATION: 'ORDER BY duration ASC',
}

export const getHighscores = async (kind: HighscoreKind = 'HIGHSCORE') => {
  const breakdowns = Object.values(HighscoreBreakdown)
  const runeTiers = Object.values(HighscoreRuneTier)

  const results: Array<{
    kind: HighscoreKind
    breakdown: HighscoreBreakdown
    runeTier: HighscoreRuneTier
    rows: HighscoreRow[]
  }> = []

  for (const breakdown of breakdowns) {
    for (const runeTier of runeTiers) {
      const filter = runeFilterByKind[kind][runeTier] ?? ''
      const partition = partitionBy[breakdown]
      const order = orderBy[kind]

      const rows = await prisma.$queryRawUnsafe<HighscoreRow[]>(`
        SELECT * FROM (
          SELECT
            id AS "gameId",
            "playerId",
            "normalizedClass",
            "normalizedRace",
            char,
            score,
            turns,
            duration,
            runes,
            ROW_NUMBER() OVER (PARTITION BY ${partition} ${order})::int AS rank,
            GREATEST(0, 11 - ROW_NUMBER() OVER (PARTITION BY ${partition} ${order}))::int AS points
          FROM "Game"
          WHERE "isWin" = true
            AND "playerId" NOT IN (SELECT id FROM "Player" WHERE "isBot" = true)
            ${filter}
        ) ranked
        WHERE rank <= ${LIMIT}
      `)

      results.push({ kind, breakdown, runeTier, rows })

      logger(`Highscores [${kind}]: ${breakdown}/${runeTier} — ${rows.length} entries`)
    }
  }

  return results
}
