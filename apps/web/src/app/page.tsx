import dayjs from 'dayjs'
import { sample } from 'lodash-es'
import { fetchApi } from '~/api/server'
import { MainPage } from '~/screens/main'
import { Game, Player, StaticData } from '~/types'

const nicknames = [
  'MegaDestroyer3000',
  'Stone Soup Sipper',
  'Dungeon Dancer',
  'Treasure Hunter Extraordinaire',
  'Monster Muncher',
  'Rune Runner',
  'Perpetual Potion Popper',
  'Scroll Scholar',
  'Trap Tactician',
  'Godly Gourmand',
  'Zig Zagger',
  'Spider Slayer',
  'Loot Looter',
  'Vault Vandal',
  'Crawl Crusher',
  'Dungeon Delver',
  'Rune Ransacker',
  'Scroll Snatcher',
].map((n) => n.replaceAll(' ', ''))

async function getData() {
  const topRes: { data: TopPlayers } = await fetchApi('/top', {
    next: { revalidate: 300 },
    cache: 'force-cache',
  }).then((r) => r.json())
  const topWithManyGamesRes: { data: TopPlayers } = await fetchApi(
    '/top?minGamesThresholdForWinrate=500',
    {
      next: { revalidate: 300 },
      cache: 'force-cache',
    },
  ).then((r) => r.json())
  const topRecentRes: { data: TopPlayers } = await fetchApi(
    `/top?minGamesThresholdForWinrate=27&since=${encodeURIComponent(dayjs().subtract(1, 'year').toISOString())}`,
    { next: { revalidate: 300 }, cache: 'force-cache' },
  ).then((r) => r.json())
  const topVeryRecentRes: { data: TopPlayers } = await fetchApi(
    `/top?minGamesThresholdForWinrate=15&since=${encodeURIComponent(dayjs().subtract(1, 'month').toISOString())}`,
    { next: { revalidate: 300 }, cache: 'force-cache' },
  ).then((r) => r.json())
  const res = await fetchApi('/main', { next: { revalidate: 300 }, cache: 'force-cache' })
  const response: {
    data: {
      combosData?: CombosData
      gamesByEndAt: Array<Game>
      gamesByTC: Array<Game>
      gamesByDuration: Array<Game>
      gamesByScore: Array<Game>
      gamesByTC15Runes: Array<Game>
      gamesByDuration15Runes: Array<Game>
      gamesByScore3Runes: Array<Game>
    }
  } = await res.json()
  const staticRes = await fetchApi('/static-data', {
    next: { revalidate: 300 },
    cache: 'force-cache',
  })
  const staticData: StaticData = await staticRes.json()

  return {
    ...response.data,
    races: staticData.races,
    classes: staticData.classes,
    gods: staticData.gods,
    topPlayers: topRes.data,
    topPlayersWithManyGames: topWithManyGamesRes.data,
    topPlayersRecent: topRecentRes.data,
    topPlayersVeryRecent: topVeryRecentRes.data,
    nickname: sample(nicknames) ?? '',
  }
}

export type MainPageData = Awaited<ReturnType<typeof getData>>

export default async function Page(_props: PageProps<'/'>) {
  const data = await getData()

  return <MainPage {...data} />
}

type Stats = { wins: number; total: number }
type Combos = Record<string, Stats>
type CombosData = Stats & { combos: Combos }

type TopPlayers = {
  gamesTotal: number
  winsTotal: number
  minGamesThresholdForWinrate: number
  byWins: Array<Pick<Player, 'name'> & { wins: number }>
  byWinrate: Array<Pick<Player, 'name'> & { winrate: number; games: number }>
  byTitles: Array<Pick<Player, 'name'> & { titles: number }>
}
