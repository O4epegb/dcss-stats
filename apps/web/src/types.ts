export type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never }

export type XOR<T, U> = T | U extends object ? (Without<T, U> & U) | (Without<U, T> & T) : T | U

export interface PlayerInfoResponse {
  player: Player
  lastGames: Game[]
  stats: Stats
  races: Race[]
  classes: Class[]
  titlesCount: Record<string, number>
  firstGame: Game
  firstWin?: Game
  gamesBeforeFirstWin: number
  lowestXlWin: Game | null
  matrix: MatrixRecordType
  gamesToFirstWin: GamesToFirstWin
  gods: Array<
    God & {
      win: boolean
      wins: number
      games: number
      gamesToFirstWin: number
    }
  >
  streaks: StreaksInfo
  tiamat: {
    total: number
    unwon: string[]
    detailed: Array<{
      name: string
      games: number
      wins: number
      gamesToFirstWin: number
    }>
  }
}

export type GamesToFirstWin = {
  classes: Record<string, number>
  races: Record<string, number>
}

export interface StreaksInfo {
  total: number
  best: number
  average: number
  current: number
  inTop100: Array<
    Pick<Streak, 'isBroken' | 'length' | 'type'> & {
      rank: number
    }
  >
}

export interface Player {
  id: string
  name: string
}

export interface Game {
  id: string
  isWin: boolean
  startAt: string
  endAt: string
  playerId: string
  player?: Player
  version: string
  versionShort: string
  versionInteger: number
  score: number
  xl: number
  race: string
  class: string
  normalizedRace: string
  raceAbbr: string
  classAbbr: string
  char: string
  title: string
  god: string | null
  piety: number | null
  endMessage: string
  logfileId: string
  turns: number
  duration: number
  branch: string
  lvl: number
  runes: number
  uniqueRunes: number
  gems: number
  fifteenskills: string[]
  maxskills: string[]
  name: string
  str: number
  int: number
  dex: number
  ac?: number
  ev?: number
  sh?: number
  server?: Server
}

export interface Stats {
  lastMonth: {
    wins: number
    total: number
  }
  average: {
    score: number | null
    runesWon: number | null
    runesLost: number | null
    gameTime: number | null
    gameTurnCount: number | null
    winTime: number | null
    winTurnCount: number | null
  }
  max: {
    score: number | null
    winTime: number | null
    winTurnCount: number | null
  }
  min: {
    winTime: number | null
    winTurnCount: number | null
  }
  total: {
    score: number | null
    runesWon: number | null
    runesLost: number | null
    gemsWon: number | null
    gemsLost: number | null
    games: number
    wins: number
    timePlayed: number | null
  }
}

export interface Race {
  name: string
  abbr: string
  trunk: boolean
  isSubRace: boolean
}

export interface Class {
  name: string
  abbr: string
  trunk: boolean
}

export type MatrixRecordType = Record<string, CharStat>

export interface CharStat {
  wins: number
  games: number
  winRate: number
  maxXl: number | undefined
  gamesToFirstWin: number | undefined
}

export type Server = {
  abbreviation: string
  id: string
  morgueUrl: string
  url: string
  baseUrl: string
  name: string
}

export type God = {
  name: string
  trunk: boolean
}

export type Skill = {
  name: string
  trunk: boolean
}

export type Logfile = {
  games: number
  path: string
  version: string
  lastFetched?: string
}

export type StaticData = {
  races: Race[]
  classes: Class[]
  gods: God[]
  skills: Skill[]
  versions: string[]
  filterOptions: {
    name: string
    type: string
    suboptions: string[]
    conditions: string[]
    placeholder: string
    values: string[]
  }[]
}

export type Stream = {
  username: string
  login: string
  viewers: number
  thumbnail: string
}

export type SupportersCurrentResponse = {
  total: number
  goal: number
}

export type SupportersListResponse = {
  oneTimeDonations: Donation[]
  subscriptionDonations: Donation[]
}

export type Donation = {
  id: number | string
  type: 'one-time' | 'subscription'
  source: 'buymeacoffee' | 'kofi' | 'other'
  amount: number
  currency: string
  createdAt: string
  currentPeriodStart?: string
  currentPeriodEnd?: string
  isActiveNow?: boolean
  durationType?: string
}

export type Streak = {
  id: string
  startedAt: string
  endedAt?: string | null
  isBroken: boolean
  length: number
  type: 'UNIQUE' | 'MONO' | 'MIXED'
  player: Player
  games: {
    gameId: string
    game: {
      char: string
      isWin: boolean
    }
  }[]
}
