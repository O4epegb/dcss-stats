import { Player, Game, StreakType } from '@prisma/client'
import { orderBy, first } from 'lodash-es'
import { prisma } from '~/prisma'

export const getStreaksByPlayer = async (player: { id: Player['id'] }) => {
  type SimpleGame = Pick<Game, 'id' | 'isWin' | 'char' | 'endAt' | 'startAt'>

  const streakGames = await prisma.$queryRaw<SimpleGame[]>`
    SELECT id, "isWin", char, "endAt", "startAt" FROM
        (SELECT * 
          , LAG("isWin") OVER (ORDER BY "startAt") AS lag
          , LAG("isWin", 2) OVER (ORDER BY "startAt") AS lag2
          , LEAD("isWin") OVER (ORDER BY "startAt") AS lead
        FROM "Game"
        WHERE "playerId" = ${player.id}) AS foo
    WHERE ("isWin" = TRUE AND (lag = TRUE OR lead = TRUE)) OR ("isWin" = FALSE AND lag = TRUE AND lag2 = TRUE)
    `

  const streaks: Array<SimpleGame[]> = []
  let current: SimpleGame[] = []

  streakGames.forEach((game, index) => {
    const next = streakGames[index + 1]

    current.push(game)

    if (!game.isWin || !next) {
      streaks.push(current)
      current = []
    }
  })

  const streaksWithoutBreaks = streaks.map((streak) => streak.filter((x) => x.isWin))
  const orderedStreaks = orderBy(streaksWithoutBreaks, (streak) => streak.length, 'desc')

  return {
    total: streaksWithoutBreaks.length,
    average:
      streaksWithoutBreaks.reduce((acc, streak) => acc + streak.length, 0) /
      streaksWithoutBreaks.length,
    best: first(orderedStreaks)?.length,
    streaksWithMetadata: streaks.map((streak) => {
      const games = streak.map(({ id, isWin, char, endAt, startAt }) => ({
        id,
        isWin,
        char,
        endAt,
        startAt,
      }))

      const winChars = games.filter((game) => game.isWin).map((game) => game.char)
      const isUniqueByChar = new Set(winChars).size === winChars.length
      const isMono = new Set(winChars).size === 1
      const type: StreakType = isUniqueByChar
        ? StreakType.UNIQUE
        : isMono
          ? StreakType.MONO
          : StreakType.MIXED

      return {
        games,
        type,
      }
    }),
  }
}
