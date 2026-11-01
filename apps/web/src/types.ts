import type { Game, StaticData } from '~/api/generated/models'

export type { Game, StaticData }

export type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never }

export type XOR<T, U> = T | U extends object ? (Without<T, U> & U) | (Without<U, T> & T) : T | U

export interface PlayerInfoResponse {
  player: Player
  lastGames: Game[]
  filter: {
    servers: string[] | null
  }
  servers: Array<{
    abbreviation: string
    games: number
  }>
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
  highscores: {
    score: PlayerLeaderboard
    turncount: PlayerLeaderboard
    duration: PlayerLeaderboard
  }
}

export type PlayerLeaderboardEntry = {
  breakdown: HighscoreBreakdown
  runeTier: HighscoreRuneTier
  rank: number
  char: string
  score: number
  turns: number
  duration: number
  points: number
}

export type PlayerLeaderboard = {
  tiers: Array<{
    runeTier: HighscoreRuneTier
    entries: PlayerLeaderboardEntry[]
    total: number
  }>
  points: number
  rank: number | null
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

export type Race = StaticData['races'][number]

export type Class = StaticData['classes'][number]

export type MatrixRecordType = Record<string, CharStat>

export interface CharStat {
  wins: number
  games: number
  winRate: number
  maxXl: number | undefined
  gamesToFirstWin: number | undefined
}

export type Server = Game['server']

export type God = StaticData['gods'][number]

export type Skill = StaticData['skills'][number]

export type Logfile = {
  games: number
  path: string
  version: string
  lastFetched?: string
}

export type Stream = {
  id: string
  platform: 'twitch' | 'youtube'
  username: string
  viewers: number | null
  thumbnail: string
  url: string
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
  source: 'buymeacoffee' | 'github' | 'kofi' | 'bitcoin' | 'other'
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

export type HighscoreBreakdown = 'CLASS' | 'RACE' | 'CHAR'
export type HighscoreRuneTier = 'ALL' | 'TIER_1' | 'TIER_2'
export type HighscoreKind = 'HIGHSCORE' | 'TURN_COUNT' | 'DURATION'

export type Highscore = {
  gameId: string
  playerId: string
  kind: HighscoreKind
  breakdown: HighscoreBreakdown
  runeTier: HighscoreRuneTier
  normalizedClass: string
  normalizedRace: string
  char: string
  score: number
  turns: number
  duration: number
  runes: number
  rank: number
  player: Player
  game: Game
}

export type HighscoresResponse = {
  data: Highscore[]
  total: number
  skip: number
  take: number
}

export type HighscoresLeaderboardResponse = {
  data: {
    playerId: string
    playerName: string
    points: number
    entryCount: number
    rank: number
  }[]
  total: number
  skip: number
  take: number
}

export type CombinedLeaderboardResponse = {
  data: {
    playerId: string
    playerName: string
    highscorePoints: number
    turncountPoints: number
    durationPoints: number
    totalPoints: number
    rank: number
  }[]
  total: number
  skip: number
  take: number
}

export type HighscoresRecordsResponse = {
  data: {
    playerId: string
    playerName: string
    records: number
    rank: number
    combos: {
      char: string
      runeTier: HighscoreRuneTier
      value: number
    }[]
  }[]
  total: number
  skip: number
  take: number
}
