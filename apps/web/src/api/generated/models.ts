export type GameServer = {
  id: string
  name: string
  abbreviation: string
  url: string
  baseUrl: string
  morgueUrl: string
  ttyrecUrl: string | null
  isDormant: boolean
}

export interface Game {
  id: string
  isWin: boolean
  startAt: string
  endAt: string
  version: string
  versionShort: string
  versionInteger: number
  score: number
  xl: number
  race: string
  class: string
  normalizedRace: string
  normalizedClass: string
  raceAbbr: string
  classAbbr: string
  char: string
  title: string
  endMessage: string
  turns: number
  duration: number
  uniqueRunes: number
  runes: number
  gems: number
  intactGems: number
  branch: string
  lvl: number
  fifteenskills: string[]
  maxskills: string[]
  name: string
  str: number
  int: number
  dex: number
  ac: number | null
  ev: number | null
  sh: number | null
  god: string | null
  piety: number | null
  killer: string | null
  killerType: string | null
  scrollsused: number | null
  potionsused: number | null
  gold: number | null
  goldfound: number | null
  goldspent: number | null
  playerId: string
  serverAbbreviation: string | null
  server: GameServer
}

export interface ApiError {
  statusCode: number
  error: string
  message: string
  code?: string
}

export type StaticDataRacesItem = {
  name: string
  abbr: string
  trunk: boolean
  isSubRace: boolean
}

export type StaticDataClassesItem = {
  name: string
  abbr: string
  trunk: boolean
}

export type StaticDataGodsItem = {
  name: string
  trunk: boolean
}

export type StaticDataSkillsItem = {
  name: string
  trunk: boolean
}

export type StaticDataServersItem = {
  abbreviation: string
  url: string
  ttyrecUrl: string | null
}

export type StaticDataFilterOptionsItem = {
  name: string
  type: string
  suboptions: string[]
  conditions: string[]
  placeholder: string
  values: string[]
}

export interface StaticData {
  races: StaticDataRacesItem[]
  classes: StaticDataClassesItem[]
  gods: StaticDataGodsItem[]
  versions: string[]
  skills: StaticDataSkillsItem[]
  servers: StaticDataServersItem[]
  filterOptions: StaticDataFilterOptionsItem[]
}

export interface SearchGamesResponse {
  count: number
  data: Game[]
}

export type GamesResponseDataItemPlayer = {
  id: string
  name: string
  isBot: boolean
}

export type GamesResponseDataItem = Game & {
  player?: GamesResponseDataItemPlayer
}

export interface GamesResponse {
  count: number
  data: GamesResponseDataItem[]
}

export type SearchGamesParams = {
  after?: string
  orderBy?: (typeof SearchGamesOrderBy)[keyof typeof SearchGamesOrderBy]
  /**
   * @maxItems 15
   */
  filter?: SearchGamesFilterItem[]
  skipCount?: boolean
}

export const SearchGamesOrderBy = { startAt: 'startAt', endAt: 'endAt' } as const
export type SearchGamesFilterItem = {
  option: string
  suboption?: string
  condition: string
  value: string
  operator: string
}

export type GetGamesParams = {
  id?: string
  player?: string
  after?: string
  isWin?: boolean
  race?: string
  class?: string
  god?: string
  title?: string
  version?: string[]
  server?: string[]
  includePlayer?: boolean
  runes?: number[] | number
  orderBy?: (typeof GetGamesOrderBy)[keyof typeof GetGamesOrderBy]
}

export const GetGamesOrderBy = { startAt: 'startAt', endAt: 'endAt' } as const
