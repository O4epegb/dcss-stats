export { getRouteCacheKey } from './routeKey'

export type CacheKey = string

export interface CacheRequest<TValue> {
  key: CacheKey
  loader: () => Promise<TValue>
  skipCache?: boolean
}

export interface CacheOptions {
  /** Seconds since the last successful load before background revalidation starts. */
  revalidate?: number
  /** Seconds since the last successful load before requests must wait for fresh data. */
  expire: number
  /**
   * Retained-entry limit. In-flight loads can temporarily exceed it.
   */
  maxEntries?: number
}

export interface CacheManager {
  get<TValue>(request: CacheRequest<TValue>): Promise<TValue>
  clear(key?: CacheKey): void
}

export const defaultCacheOptions: Required<Omit<CacheOptions, 'expire'>> = {
  revalidate: 300,
  maxEntries: 256,
}

type CacheEntry<TValue = unknown> = {
  pendingPromise?: Promise<TValue>
  value?: TValue
  resolvedAt?: number
}

export function createCache(options: CacheOptions): CacheManager {
  const resolvedOptions = { ...defaultCacheOptions, ...options }
  if (
    resolvedOptions.expire !== Infinity &&
    (!Number.isFinite(resolvedOptions.expire) || resolvedOptions.expire < 0)
  ) {
    throw new RangeError('expire must be a non-negative finite number or Infinity')
  }
  if (!Number.isSafeInteger(resolvedOptions.maxEntries) || resolvedOptions.maxEntries < 1) {
    throw new RangeError('maxEntries must be a positive safe integer')
  }
  const revalidateMs = Number.isFinite(resolvedOptions.revalidate)
    ? resolvedOptions.revalidate * 1000
    : Infinity
  const expireMs = resolvedOptions.expire * 1000

  const store = new Map<CacheKey, CacheEntry>()

  return {
    async get<TValue>({ key, loader, skipCache }: CacheRequest<TValue>): Promise<TValue> {
      const entry = store.get(key) as CacheEntry<TValue> | undefined
      const now = Date.now()

      if (!entry) {
        return loadAndStore(key, loader)
      }

      // Map insertion order is the LRU order.
      store.delete(key)
      store.set(key, entry)

      if (skipCache) {
        return refreshEntity(entry, key, loader)
      }

      if (
        expireMs !== Infinity &&
        entry.resolvedAt !== undefined &&
        now - entry.resolvedAt >= expireMs
      ) {
        return refreshEntity(entry, key, loader)
      }

      if (entry.pendingPromise && entry.value === undefined) {
        return entry.pendingPromise
      }

      if (entry.value === undefined) {
        store.delete(key)
        return loadAndStore(key, loader)
      }

      const shouldRevalidate =
        revalidateMs !== Infinity &&
        entry.resolvedAt !== undefined &&
        now - entry.resolvedAt >= revalidateMs

      if (shouldRevalidate && !entry.pendingPromise) {
        refreshEntity(entry, key, loader).catch(() => undefined)
        return entry.value
      }

      if (entry.pendingPromise) {
        return entry.pendingPromise
      }

      return entry.value
    },
    clear(key?: CacheKey) {
      if (key !== undefined) {
        store.delete(key)
      } else {
        store.clear()
      }
    },
  }

  function trimStore() {
    for (const [key, entry] of store) {
      if (store.size <= resolvedOptions.maxEntries) break
      // Evicting a pending load would allow another request to start a duplicate.
      if (!entry.pendingPromise) store.delete(key)
    }
  }

  function loadAndStore<TValue>(key: CacheKey, loader: () => Promise<TValue>): Promise<TValue> {
    const loaderPromise = loader()
    const entry: CacheEntry = {
      pendingPromise: loaderPromise,
    }

    store.set(key, entry)
    trimStore()

    loaderPromise
      .then((value) => {
        if (store.get(key) !== entry) {
          return value
        }

        commitEntry(entry, value)
        return value
      })
      .catch(() => {
        if (store.get(key) === entry) {
          store.delete(key)
        }
      })

    return loaderPromise
  }

  function refreshEntity<TValue>(
    entry: CacheEntry<TValue>,
    key: CacheKey,
    loader: () => Promise<TValue>,
  ): Promise<TValue> {
    if (entry.pendingPromise) {
      return entry.pendingPromise
    }

    const refreshPromise = loader()
      .then((value) => {
        if (store.get(key) !== entry) {
          return value
        }

        commitEntry(entry, value)
        return value
      })
      .catch((error) => {
        if (store.get(key) === entry) {
          if (entry.value === undefined) {
            store.delete(key)
          }
        }

        throw error
      })
      .finally(() => {
        if (entry.pendingPromise === refreshPromise) {
          entry.pendingPromise = undefined
          trimStore()
        }
      })

    entry.pendingPromise = refreshPromise
    return refreshPromise
  }

  function commitEntry(entry: CacheEntry, value: unknown) {
    const resolvedAt = Date.now()
    entry.value = value
    entry.resolvedAt = resolvedAt
    entry.pendingPromise = undefined
    trimStore()
  }
}
