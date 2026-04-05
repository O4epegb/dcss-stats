import { HighscoreBreakdown, HighscoreRuneTier } from '~/generated/prisma/client/client'
import { prisma } from '~/prisma'
import { logger } from '~/utils'

const LIMIT = 100

type HighscoreRow = {
  gameId: string
  playerId: string
  normalizedClass: string
  normalizedRace: string
  char: string
  score: number
  runes: number
  rank: number
  points: number
}

const partitionBy: Record<HighscoreBreakdown, string> = {
  CLASS: '"normalizedClass"',
  RACE: '"normalizedRace"',
  CHAR: '"char"',
}

const runeFilter: Record<HighscoreRuneTier, string> = {
  ALL: '',
  THREE_RUNES: 'AND "runes" = 3',
  FOUR_PLUS_RUNES: 'AND "runes" >= 4',
}

const nullFilter: Record<HighscoreBreakdown, string> = {
  CLASS: 'AND "normalizedClass" IS NOT NULL',
  RACE: '',
  CHAR: '',
}

export const getHighscores = async () => {
  const breakdowns = Object.values(HighscoreBreakdown)
  const runeTiers = Object.values(HighscoreRuneTier)

  const results: Array<{
    breakdown: HighscoreBreakdown
    runeTier: HighscoreRuneTier
    rows: HighscoreRow[]
  }> = []

  for (const breakdown of breakdowns) {
    for (const runeTier of runeTiers) {
      const filter = runeFilter[runeTier]
      const partition = partitionBy[breakdown]
      const nulls = nullFilter[breakdown]

      const rows = await prisma.$queryRawUnsafe<HighscoreRow[]>(`
        SELECT * FROM (
          SELECT
            id AS "gameId",
            "playerId",
            "normalizedClass",
            "normalizedRace",
            char,
            score,
            runes,
            ROW_NUMBER() OVER (PARTITION BY ${partition} ORDER BY score DESC)::int AS rank,
            GREATEST(0, 11 - ROW_NUMBER() OVER (PARTITION BY ${partition} ORDER BY score DESC))::int AS points
          FROM "Game"
          WHERE "isWin" = true
            AND "playerId" NOT IN (SELECT id FROM "Player" WHERE "isBot" = true)
            ${filter}
            ${nulls}
        ) ranked
        WHERE rank <= ${LIMIT}
      `)

      results.push({ breakdown, runeTier, rows })

      logger(`Highscores: ${breakdown}/${runeTier} — ${rows.length} entries`)
    }
  }

  return results
}
