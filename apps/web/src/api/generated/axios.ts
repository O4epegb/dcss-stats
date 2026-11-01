import { apiRequest } from '../request'
import type {
  Game,
  GamesResponse,
  GetGamesParams,
  SearchGamesParams,
  SearchGamesResponse,
  StaticData,
} from './models'

type SecondParameter<T extends (...args: never) => unknown> = Parameters<T>[1]

export const getStaticData = (options?: SecondParameter<typeof apiRequest<StaticData>>) => {
  return apiRequest<StaticData>({ url: `/api/static-data`, method: 'GET' }, options)
}

export const searchGames = (
  params?: SearchGamesParams,
  options?: SecondParameter<typeof apiRequest<SearchGamesResponse>>,
) => {
  return apiRequest<SearchGamesResponse>({ url: `/api/search`, method: 'GET', params }, options)
}

export const getGames = (
  params?: GetGamesParams,
  options?: SecondParameter<typeof apiRequest<GamesResponse>>,
) => {
  return apiRequest<GamesResponse>({ url: `/api/games`, method: 'GET', params }, options)
}

export const getGame = (id: string, options?: SecondParameter<typeof apiRequest<Game>>) => {
  return apiRequest<Game>(
    { url: `/api/games/${encodeURIComponent(String(id))}`, method: 'GET' },
    options,
  )
}

export type GetStaticDataResult = NonNullable<Awaited<ReturnType<typeof getStaticData>>>
export type SearchGamesResult = NonNullable<Awaited<ReturnType<typeof searchGames>>>
export type GetGamesResult = NonNullable<Awaited<ReturnType<typeof getGames>>>
export type GetGameResult = NonNullable<Awaited<ReturnType<typeof getGame>>>
