import { CacheManager, defaultCacheOptions } from '~/app/cache'
import { trackError } from '~/utils'
import { SupportersData } from './types'

const MAX_FALLBACK_AGE_MS = 24 * 60 * 60 * 1000

export function createCachedSupportersLoader(
  cache: CacheManager,
  key: string,
  loader: () => Promise<SupportersData>,
) {
  let lastSuccess: { data: SupportersData; resolvedAt: number } | undefined
  let lastError: Error | undefined
  let retryAt = 0

  const getFallback = () => {
    if (lastSuccess && Date.now() - lastSuccess.resolvedAt < MAX_FALLBACK_AGE_MS) {
      return lastSuccess.data
    }
    return undefined
  }

  return async (): Promise<SupportersData> => {
    if (lastError && Date.now() < retryAt) {
      const fallback = getFallback()
      if (fallback) return fallback
      throw lastError
    }

    try {
      return await cache.get({
        key,
        loader: async () => {
          try {
            const data = await loader()
            lastSuccess = { data, resolvedAt: Date.now() }
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
      const fallback = getFallback()
      if (fallback) return fallback
      throw error
    }
  }
}
