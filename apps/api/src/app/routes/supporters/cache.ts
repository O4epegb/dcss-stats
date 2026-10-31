import { CacheManager, defaultCacheOptions } from '~/app/cache'
import { trackError } from '~/utils'
import { SupportersData } from './types'

export function createCachedSupportersLoader(
  cache: CacheManager,
  key: string,
  loader: () => Promise<SupportersData>,
) {
  let lastData: SupportersData | undefined
  let lastError: Error | undefined
  let retryAt = 0

  return async (): Promise<SupportersData> => {
    if (lastError && Date.now() < retryAt) {
      if (lastData) return lastData
      throw lastError
    }

    try {
      return await cache.get({
        key,
        loader: async () => {
          try {
            const data = await loader()
            lastData = data
            lastError = undefined
            return data
          } catch (error) {
            lastError = error instanceof Error ? error : new Error('Supporters fetch failed')
            retryAt = Date.now() + defaultCacheOptions.revalidate * 1000
            trackError(lastError)
            throw lastError
          }
        },
      })
    } catch (error) {
      // Concurrent requests can await a failed refresh even when the cache has older data.
      if (lastData) return lastData
      throw error
    }
  }
}
