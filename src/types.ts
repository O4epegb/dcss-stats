import type { GetServerSideProps, NextPage } from 'next';
import { ParsedUrlQuery } from 'querystring';

export type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };

export type XOR<T, U> = T | U extends object ? (Without<T, U> & U) | (Without<U, T> & T) : T | U;

export type AppData = any;

export type Page<P = any> = NextPage<P> & {
  getLayout?: (page: JSX.Element) => JSX.Element;
};
export type getSSProps<
  P extends { [key: string]: any } = { [key: string]: any },
  Q extends ParsedUrlQuery = ParsedUrlQuery,
> = GetServerSideProps<P & AppData, Q>;

export interface PlayerInfoResponse {
  player: Player;
  lastGames: Game[];
  stats: Stats;
  races: Race[];
  classes: Class[];
  titlesCount: Record<string, number>;
  firstGame: Game;
  firstWin?: Game;
  gamesBeforeFirstWin: number;
  lowestXlWin: Game | null;
  matrix: Matrix;
  gamesToFirstWin: GamesToFirstWin;
  gods: God[];
  streaks: StreaksInfo;
  tiamat: {
    total: number;
    unwon: string[];
  };
}

export type GamesToFirstWin = {
  classes: Record<string, number>;
  races: Record<string, number>;
};

export interface StreaksInfo {
  total: number;
  best: number;
  average: number;
  current: number;
}

export interface Player {
  id: string;
  name: string;
}

export interface Game {
  id: string;
  isWin: boolean;
  startAt: string;
  endAt: string;
  playerId: string;
  player?: Player;
  version: string;
  versionShort: string;
  score: number;
  xl: number;
  race: string;
  class: string;
  normalizedRace: string;
  raceAbbr: string;
  classAbbr: string;
  char: string;
  title: string;
  god: string | null;
  piety: number | null;
  endMessage: string;
  logfileId: string;
  turns: number;
  duration: number;
  branch: string;
  lvl: number;
  runes: number;
  uniqueRunes: number;
  fifteenskills: string[];
  maxskills: string[];
  name: string;
  str: number;
  int: number;
  dex: number;
  ac?: number;
  ev?: number;
  sh?: number;
  server?: Server;
}

export interface Stats {
  lastMonth: {
    wins: number;
    total: number;
  };
  average: {
    score: number | null;
    runesWon: number | null;
    runesLost: number | null;
    gameTime: number | null;
    winTime: number | null;
    winTurnCount: number | null;
  };
  max: {
    score: number | null;
    winTime: number | null;
    winTurnCount: number | null;
  };
  min: {
    winTime: number | null;
    winTurnCount: number | null;
  };
  total: {
    score: number | null;
    runesWon: number | null;
    runesLost: number | null;
    games: number;
    wins: number;
    timePlayed: number | null;
  };
}

export interface Race {
  name: string;
  abbr: string;
  trunk: boolean;
}

export interface Class {
  name: string;
  abbr: string;
  trunk: boolean;
}

export type Matrix = Record<string, CharStat>;

export interface CharStat {
  wins: number;
  games: number;
  maxXl: number;
  winRate: number;
  gamesToFirstWin: number;
}

export type Server = {
  abbreviation: string;
  id: string;
  morgueUrl: string;
  url: string;
  baseUrl: string;
  name: string;
};

export type God = {
  name: string;
  trunk: boolean;
  win: boolean;
};

export type Skill = {
  name: string;
  trunk: boolean;
};

export type Logfile = {
  games: number;
  path: string;
  version: string;
  lastFetched?: string;
};

export type StaticData = {
  races: Race[];
  classes: Class[];
  gods: God[];
  skills: Skill[];
  versions: string[];
};
