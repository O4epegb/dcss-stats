import { first, groupBy, map, maxBy, memoize, orderBy, reduce, uniq } from 'lodash-es'
import dayjs from 'dayjs'
import semver from 'semver'
import { Game, Player, Prisma } from '@prisma/client'
import { prisma } from '../prisma'
import { GameWithLogfileAndServer } from '../types'

const LIMIT = 10

export const getMatrix = (games: Game[]) => {
  games = orderBy(games, (g) => g.startAt, 'asc')

  const gamesToFirstWin = {
    classes: reduce(
      groupBy(games, (g) => g.classAbbr),
      (acc, value, key) => {
        const count = value.findIndex((g) => g.isWin)

        acc[key] = count < 0 ? 0 : count + 1

        return acc
      },
      {} as Record<string, number>,
    ),
    races: reduce(
      groupBy(games, (g) => g.raceAbbr),
      (acc, value, key) => {
        const count = value.findIndex((g) => g.isWin)

        acc[key] = count < 0 ? 0 : count + 1

        return acc
      },
      {} as Record<string, number>,
    ),
  }

  return {
    gamesToFirstWin,
    matrix: reduce(
      groupBy(games, (g) => g.char),
      (acc, value, key) => {
        const games = value.length
        const wins = value.filter((g) => g.isWin).length
        const gamesToFirstWin = value.findIndex((g) => g.isWin)

        acc[key] = {
          wins,
          games,
          winRate: Math.round((wins / games) * 100) / 100,
          maxXl: maxBy(value, (g) => g.xl)?.xl ?? 0,
          gamesToFirstWin: gamesToFirstWin < 0 ? 0 : gamesToFirstWin + 1,
        }

        return acc
      },
      {} as Record<
        string,
        { wins: number; games: number; winRate: number; maxXl: number; gamesToFirstWin: number }
      >,
    ),
  }
}

export const getStats = async (player: Player) => {
  const [won, lost, all, last30Days] = await Promise.all([
    prisma.game.aggregate({
      where: { playerId: player.id, isWin: true },
      _avg: { uniqueRunes: true, duration: true, turns: true },
      _sum: { uniqueRunes: true },
      _min: { duration: true, turns: true },
      _max: { duration: true, turns: true },
      _count: { _all: true },
    }),
    prisma.game.aggregate({
      where: { playerId: player.id, isWin: false },
      _avg: { uniqueRunes: true },
      _sum: { uniqueRunes: true },
    }),
    prisma.game.aggregate({
      where: { playerId: player.id },
      _avg: { score: true, duration: true },
      _max: { score: true },
      _sum: { score: true, duration: true },
      _count: { _all: true },
    }),
    prisma.game.findMany({
      where: {
        playerId: player.id,
        startAt: { gte: dayjs().subtract(30, 'days').startOf('day').toDate() },
      },
    }),
  ])

  return {
    lastMonth: {
      wins: last30Days.filter((game) => game.isWin).length,
      total: last30Days.length,
    },
    average: {
      score: all._avg.score,
      runesWon: won._avg.uniqueRunes,
      runesLost: lost._avg.uniqueRunes,
      gameTime: all._avg.duration,
      winTime: won._avg.duration,
      winTurnCount: won._avg.turns,
    },
    max: {
      score: all._max.score,
      winTime: won._max.duration,
      winTurnCount: won._max.turns,
    },
    min: {
      winTime: won._min.duration,
      winTurnCount: won._min.turns,
    },
    total: {
      score: all._sum.score,
      runesWon: won._sum.uniqueRunes,
      runesLost: lost._sum.uniqueRunes,
      games: all._count._all,
      wins: won._count._all,
      timePlayed: all._sum.duration,
    },
  }
}

export const findGames = async (
  args?: Omit<Prisma.GameFindManyArgs, 'select' | 'include'>,
  includePlayer?: boolean,
) => {
  return prisma.game
    .findMany({
      ...args,
      include: {
        player: Boolean(includePlayer),
        logfile: {
          include: {
            server: true,
          },
        },
      },
    })
    .then((games) => {
      return processGamesWithLogfile(games)
    })
}

const processGamesWithLogfile = (games: GameWithLogfileAndServer[]) => {
  return games.map(({ logfile, logfileId, ...rest }) => {
    return Object.assign(rest, {
      server: {
        ...logfile.server,
        morgueUrl: logfile.server.morgueUrl + (logfile.morgueUrlPrefix ?? ''),
      },
    })
  })
}

export const getStaticData = memoize(() => {
  return Promise.all([
    prisma.race.findMany(),
    prisma.class.findMany(),
    prisma.god.findMany(),
    prisma.logfile.findMany().then((logfiles) => {
      const versions = logfiles
        .map((logfile) => logfile.version)
        .filter((version) => !isNaN(parseFloat(version)))
        .sort((a, b) => b.localeCompare(a, undefined, { numeric: true }))

      const { major, minor } = semver.coerce(versions[0], { loose: true })?.inc('minor') ?? {}
      const additional = major !== undefined && minor !== undefined ? [`${major}.${minor}`] : []

      return uniq(additional.concat(versions))
    }),
  ])
})

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
    findGames({
      where: { isWin: true, player: { isBot: false } },
      orderBy: { turns: 'asc' },
      take: LIMIT,
    }),
    findGames({
      where: { isWin: true, player: { isBot: false } },
      orderBy: { duration: 'asc' },
      take: LIMIT,
    }),
    findGames({
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

export const getCombosData = async (args?: Omit<Prisma.GameFindManyArgs, 'select' | 'include'>) => {
  const games = await prisma.game.findMany(args)

  const wins = games.filter((x) => x.isWin)

  const combos = games.reduce(
    (acc, game) => {
      const { raceAbbr, classAbbr, god, isWin } = game
      const key = [raceAbbr, classAbbr, god].join(',')

      const data = {
        wins: (acc[key]?.wins || 0) + Number(isWin),
        total: (acc[key]?.total || 0) + 1,
      }

      acc[key] = data

      return acc
    },
    {} as Record<string, { wins: number; total: number }>,
  )

  return {
    total: games.length,
    wins: wins.length,
    combos,
  }
}
