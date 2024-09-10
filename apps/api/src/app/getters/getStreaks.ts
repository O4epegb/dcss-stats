import { orderBy, first } from 'lodash-es'
import { Player, Game } from '@prisma/client'
import { prisma } from '~/prisma'

export const getStreaks = async (player: Player) => {
  const streakGames = await prisma.$queryRaw<Game[]>`
    SELECT * FROM
        (SELECT * 
          , LAG("isWin") OVER (ORDER BY "startAt") AS lag
          , LAG("isWin", 2) OVER (ORDER BY "startAt") AS lag2
          , LEAD("isWin") OVER (ORDER BY "startAt") AS lead
        FROM "Game"
        WHERE "playerId" = ${player.id}) AS foo
    WHERE ("isWin" = TRUE AND (lag = TRUE OR lead = TRUE)) OR ("isWin" = FALSE AND lag = TRUE AND lag2 = TRUE)
    `

  const streaks: Array<Game[]> = []
  let current: Game[] = []

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
    streaks: streaks.map((streak) =>
      streak.map(({ id, isWin, char, endAt }) => ({ id, isWin, char, endAt })),
    ),
  }
}
