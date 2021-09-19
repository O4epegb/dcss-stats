import type { GetServerSideProps, NextPage } from 'next';
import { ParsedUrlQuery } from 'querystring';

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
  titles: string[];
  firstGame: Game;
  lastGame: Game;
  lowestXlWin: Game | null;
  matrix: Matrix;
  gods: God[];
  streaks: StreaksInfo;
}

export interface StreaksInfo {
  total: number;
  best: number;
  average: number;
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
  server?: Server;
}

export interface Stats {
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

export type Logfile = {
  games: number;
  path: string;
  version: string;
};
