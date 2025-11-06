import { sample } from 'lodash-es'
import { SearchInput } from './SearchInput'

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

export const Search = async () => {
  'use cache'

  return <SearchInput nickname={sample(nicknames) ?? ''} />
}
