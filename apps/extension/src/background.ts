import browser from 'webextension-polyfill'

import { apiUrl } from './env'

type PlayerStats = {
  games: number
  name: string
  wins: number
  id?: string
  lastUpdated?: string
}

type CachedPlayerStats = PlayerStats & {
  date: number
}

type PlayerRequest = {
  name: string
}

const dayInMs = 1000 * 60 * 60 * 24
const pendingRequests = new Map<string, Promise<PlayerStats>>()

const getPlayerKey = (playerName: string) => `player-${playerName}`

const isPlayerRequest = (message: unknown): message is PlayerRequest => {
  return (
    typeof message === 'object' &&
    message !== null &&
    'name' in message &&
    typeof message.name === 'string'
  )
}

const isCachedPlayerStats = (value: unknown): value is CachedPlayerStats => {
  return (
    typeof value === 'object' &&
    value !== null &&
    'date' in value &&
    typeof value.date === 'number' &&
    'games' in value &&
    typeof value.games === 'number' &&
    'wins' in value &&
    typeof value.wins === 'number' &&
    'name' in value &&
    typeof value.name === 'string'
  )
}

const isValidCache = (value: unknown): value is CachedPlayerStats => {
  return isCachedPlayerStats(value) && Date.now() - value.date < dayInMs
}

browser.runtime.onMessage.addListener(async (message: unknown) => {
  if (!isPlayerRequest(message)) {
    return undefined
  }

  const { name: playerName } = message
  const cacheKey = getPlayerKey(playerName)
  const cachedValue: unknown = (await browser.storage.local.get(cacheKey))[cacheKey]

  if (isValidCache(cachedValue)) {
    return cachedValue
  }

  const pendingRequest = pendingRequests.get(cacheKey)
  if (pendingRequest) {
    return pendingRequest
  }

  const request = fetch(`${apiUrl}/api/players/${encodeURIComponent(playerName)}?type=minimal`, {
    mode: 'cors',
  })
    .then(async (response): Promise<PlayerStats> => {
      if (!response.ok && isCachedPlayerStats(cachedValue)) {
        return cachedValue
      }

      if (response.status === 404) {
        return {
          name: playerName,
          wins: 0,
          games: 0,
        }
      }

      if (!response.ok) {
        throw new Error(response.statusText)
      }

      return (await response.json()) as PlayerStats
    })
    .then(async (stats) => {
      await browser.storage.local.set({
        [cacheKey]: {
          ...stats,
          date: Date.now(),
        },
      })

      return stats
    })
    .finally(() => {
      pendingRequests.delete(cacheKey)
    })

  pendingRequests.set(cacheKey, request)

  return request
})
