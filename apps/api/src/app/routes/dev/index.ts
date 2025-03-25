import { uniq, groupBy, filter, orderBy } from 'lodash-es'
import { AppType } from '~/app/app'
import { getMatrix } from '~/app/getters/getMatrix'
import { getStaticData } from '~/app/getters/getStaticData'
import { prisma } from '~/prisma'

export const devRoute = (app: AppType) => {
  app.get('/api/dev/info', async () => {
    getStaticData.cache.clear?.()
    const { races, classes } = await getStaticData()

    const [nonNormalizedRaces, nonNormalizedRaceAbbrs] = await Promise.all([
      prisma.game.findMany({
        where: {
          normalizedRace: {
            notIn: races.map((x) => x.name),
          },
        },
      }),
      prisma.game.findMany({
        where: {
          raceAbbr: {
            notIn: races.map((x) => x.abbr),
          },
        },
      }),
    ])

    const [nonNormalizedClasses, nonNormalizedClassAbbrs] = await Promise.all([
      prisma.game.findMany({
        where: {
          normalizedClass: {
            notIn: classes.map((x) => x.name),
          },
        },
      }),
      prisma.game.findMany({
        where: {
          classAbbr: {
            notIn: classes.map((x) => x.abbr),
          },
        },
      }),
    ])

    return {
      nonNormalizedRaceAbbrsCount: nonNormalizedRaceAbbrs.length,
      nonNormalizedRaceAbbrs: uniq(nonNormalizedRaceAbbrs.map((g) => g.raceAbbr)),
      nonNormalizedRacesCount: nonNormalizedRaces.length,
      nonNormalizedRaces: uniq(nonNormalizedRaces.map((g) => g.normalizedRace)),
      nonNormalizedClassAbbrsCount: nonNormalizedClassAbbrs.length,
      nonNormalizedClassAbbrs: uniq(nonNormalizedClassAbbrs.map((g) => g.classAbbr)),
      nonNormalizedClassesCount: nonNormalizedClasses.length,
      nonNormalizedClasses: uniq(nonNormalizedClasses.map((g) => g.normalizedClass)),
    }
  })

  app.get('/api/dev/oneandwon', async () => {
    const gameGroupBy = await prisma.game.groupBy({
      by: ['playerId'],
      where: { isWin: true },
      _count: { isWin: true },
      orderBy: { _count: { isWin: 'desc' } },
    })

    const playersWithLotsOfWins = gameGroupBy.filter((x) => x._count.isWin >= 100)

    const allGames = await prisma.game.findMany({
      where: { playerId: { in: playersWithLotsOfWins.map((x) => x.playerId) } },
    })

    const groupedGames = groupBy(allGames, (x) => x.playerId)

    const result: Array<{ name: string; wins: number; oneandwons: number }> = []

    for (const item of playersWithLotsOfWins) {
      const games = groupedGames[item.playerId]
      const { matrix } = getMatrix(games)
      const oneandwons = filter(matrix, (value) => value.gamesToFirstWin === 1).length

      result.push({ name: item.playerId, wins: item._count.isWin, oneandwons })
    }

    return {
      result: orderBy(result, (x) => x.oneandwons, 'desc'),
    }
  })
}
