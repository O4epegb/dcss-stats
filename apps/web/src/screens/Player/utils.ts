import { keys, orderBy, reduce, uniqBy, keyBy } from 'lodash-es'
import {
  CharStat,
  Class,
  GamesToFirstWin,
  MatrixRecordType,
  PlayerInfoResponse,
  Race,
} from '~/types'
import { notEmpty } from '~/utils'

export const cookiesStoreDefault = {
  'dcss-compact-view': false,
  'dcss-open-filters': false,
  'dcss-show-trunk-data': false,
} as const

export const allUnavailableCombos = keyBy([
  'GhTm',
  'MuTm',
  'GhSh',
  'MuSh',
  'DgMo',
  'DgCK',
  'DgCA',
  'DgBe',
  'DgAK',
  'FeHu',
  'FeGl',
  'FeBr',
  'FeHs',
  'PoSh',
  'ReSh',
])

export const getSummary = (data: PlayerInfoResponse) => {
  const { matrix, races: allRaces, classes, gods, gamesToFirstWin, tiamat } = data

  const {
    stats,
    trunkClasses,
    trunkRaces,
    allActualClasses,
    allActualRaces,
    greatClasses,
    greatRaces,
    notWonClasses,
    notWonRaces,
    wonClasses,
    wonRaces,
  } = getStatsFromMatrix({
    matrix,
    allRaces,
    allClasses: classes,
    gamesToFirstWin,
  })

  const allTrunkCombos = new Set(
    trunkClasses.flatMap((klass) => trunkRaces.map((race) => race.abbr + klass.abbr)),
  )
  const trunkUnavailableCombos = Object.keys(allUnavailableCombos).filter((combo) =>
    allTrunkCombos.has(combo),
  )
  const combosCompleted = [...allTrunkCombos]
    .map((combo) => {
      return matrix[combo]?.wins > 0 ? combo : null
    })
    .flat()
    .filter(notEmpty).length

  const wonGods = gods.filter((g) => g.win)
  const isGreat = wonRaces.length === trunkRaces.length
  const isGrand = wonClasses.length === trunkClasses.length

  return {
    stats,
    combosCompleted,
    totalCombos: trunkRaces.length * trunkClasses.length - trunkUnavailableCombos.length,
    trunkRaces,
    trunkClasses,
    allActualRaces,
    allActualClasses,
    wonRaces,
    wonClasses,
    greatRaces: keyBy(greatRaces, (x) => x.abbr),
    greatClasses: keyBy(greatClasses, (x) => x.abbr),
    wonGods,
    notWonRaces,
    notWonClasses,
    notWonGods: orderBy(
      gods.filter((g) => !g.win),
      (x) => x.name.toLowerCase(),
    ),
    isGreat,
    isGrand,
    isGreater: isGreat && isGrand,
    isPolytheist: wonGods.length === gods.length,
    isTiamat: tiamat.unwon.length === 0,
  }
}

export const getStatsFromMatrix = ({
  matrix,
  allRaces,
  allClasses,
  gamesToFirstWin,
}: {
  matrix: MatrixRecordType
  allRaces: Race[]
  allClasses: Class[]
  gamesToFirstWin?: GamesToFirstWin
}) => {
  const races = allRaces.filter((r) => !r.isSubRace)
  const trunkRaces = orderBy(
    races.filter((x) => x.trunk),
    (x) => x.abbr,
  )
  const classes = allClasses
  const trunkClasses = orderBy(
    classes.filter((x) => x.trunk),
    (x) => x.abbr,
  )

  const countStat = (acc: CharStat | undefined, item: CharStat, gamesToWin: number | undefined) => {
    const stat = {
      wins: (acc?.wins || 0) + item.wins,
      games: (acc?.games || 0) + item.games,
      maxXl: item.maxXl != null ? Math.max(acc?.maxXl || 0, item.maxXl) : undefined,
    }

    return {
      ...stat,
      winRate: stat.wins / stat.games,
      gamesToFirstWin: gamesToWin ?? 0,
    }
  }

  const stats = reduce(
    matrix,
    (acc, item, key) => {
      const race = key.slice(0, 2)
      const klass = key.slice(2, 4)

      acc.classes[klass] = countStat(acc.classes[klass], item, gamesToFirstWin?.classes[klass])
      acc.races[race] = countStat(acc.races[race], item, gamesToFirstWin?.races[race])

      return acc
    },
    {
      races: {},
      classes: {},
      combos: matrix,
    } as {
      races: Record<string, CharStat>
      classes: Record<string, CharStat>
      combos: Record<string, CharStat>
    },
  )

  const wonRaces = trunkRaces.filter((x) => stats.races[x.abbr]?.wins > 0)
  const wonClasses = trunkClasses.filter((x) => stats.classes[x.abbr]?.wins > 0)
  const allActualRaces = getActual(races, stats.races)
  const allActualClasses = getActual(classes, stats.classes)
  const greatRaces = wonRaces.filter((race) => {
    return trunkClasses.every((klass) => {
      const combo = race.abbr + klass.abbr

      return allUnavailableCombos[combo] || stats.combos[combo]?.wins > 0
    })
  })
  const greatClasses = wonClasses.filter((klass) => {
    return trunkRaces.every((race) => {
      const combo = race.abbr + klass.abbr

      return allUnavailableCombos[combo] || stats.combos[combo]?.wins > 0
    })
  })

  return {
    stats,
    trunkRaces,
    trunkClasses,
    allActualRaces,
    allActualClasses,
    wonRaces,
    wonClasses,
    greatRaces: keyBy(greatRaces, (x) => x.abbr),
    greatClasses: keyBy(greatClasses, (x) => x.abbr),
    notWonRaces: trunkRaces.filter((x) => !(stats.races[x.abbr]?.wins > 0)),
    notWonClasses: trunkClasses.filter((x) => !(stats.classes[x.abbr]?.wins > 0)),
  }
}

const getActual = (items: Array<Race | Class>, summaryItems: Record<string, CharStat>) =>
  orderBy(
    uniqBy(
      [
        ...items.filter((x) => x.trunk || summaryItems[x.abbr]),
        ...keys(summaryItems).map((abbr) => ({ trunk: false, abbr, name: abbr })),
      ],
      (x) => x.abbr,
    ),
    (x) => x.abbr,
  )

export type Summary = ReturnType<typeof getSummary>

const favoritesStorageKey = 'favorites'
export const getFavorites = () => localStorage.getItem(favoritesStorageKey) || ''

export const addToFavorite = (name: string) => {
  localStorage.setItem(favoritesStorageKey, `${getFavorites()},${name}`)
}

export const removeFromFavorite = (name: string) => {
  localStorage.setItem(
    favoritesStorageKey,
    getFavorites()
      .split(',')
      .filter((x) => x && x !== name)
      .join(','),
  )
}
