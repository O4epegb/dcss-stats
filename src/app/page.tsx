import { sample } from 'lodash-es'
import { fetchApi } from '~api/server'
import { MainPage, Response } from '~screens/main'

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
].map((n) => n.replaceAll(' ', ''))

async function getData() {
  const res = await fetchApi('/stats', { next: { revalidate: 300 } })
  const response: { data: Response } = await res.json()

  return {
    ...response.data,
    nickname: sample(nicknames) ?? '',
  }
}

export default async function Page() {
  const data = await getData()

  return <MainPage {...data} />
}
