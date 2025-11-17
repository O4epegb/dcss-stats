/**
 * Legacy route-level cache. Kept for the current implementation until the new
 * cache helpers below are reviewed and adopted in each route.
 */
export const cache = new Map<string, { promise: Promise<any>; ttl: number }>()
export const ttl = 1000 * 60 * 5

export type CacheKey = string

export interface CacheRequest<TValue> {
  key: CacheKey
  loader: () => Promise<TValue>
  skipCache?: boolean
}

export interface CacheOptions {
  /**
   * Seconds until a stale-while-revalidate cycle starts.
   * Defaults to 300 seconds
   */
  revalidate?: number
  /**
   * Seconds without traffic before an entry expires forever.
   * Defaults to never (Infinity).
   */
  expire?: number
}

export interface CacheManager {
  get<TValue>(request: CacheRequest<TValue>): Promise<TValue>
  clear(key?: CacheKey): void
}

export const defaultCacheOptions: Required<CacheOptions> = {
  revalidate: 300,
  expire: Infinity,
}

type CacheEntry<TValue = unknown> = {
  pendingPromise?: Promise<TValue>
  value?: TValue
  resolvedAt?: number
  lastHit: number
}

export function createCache(options?: CacheOptions): CacheManager {
  const resolvedOptions = { ...defaultCacheOptions, ...options }
  const revalidateMs = Number.isFinite(resolvedOptions.revalidate)
    ? resolvedOptions.revalidate * 1000
    : Infinity
  const expireMs = Number.isFinite(resolvedOptions.expire)
    ? resolvedOptions.expire * 1000
    : Infinity

  const store = new Map<CacheKey, CacheEntry>()

  return {
    async get<TValue>({ key, loader, skipCache }: CacheRequest<TValue>): Promise<TValue> {
      if (skipCache) {
        return refreshNow(key, loader)
      }

      const entry = store.get(key) as CacheEntry<TValue> | undefined
      const now = Date.now()

      if (!entry) {
        return loadAndStore(key, loader)
      }

      if (expireMs !== Infinity && now - entry.lastHit >= expireMs) {
        store.delete(key)
        return loadAndStore(key, loader)
      }

      entry.lastHit = now

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
      if (key) {
        store.delete(key)
      } else {
        store.clear()
      }
    },
  }

  function loadAndStore<TValue>(key: CacheKey, loader: () => Promise<TValue>): Promise<TValue> {
    const now = Date.now()
    const loaderPromise = loader()
    const entry: CacheEntry = {
      pendingPromise: loaderPromise,
      lastHit: now,
    }

    store.set(key, entry)

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

  function refreshNow<TValue>(key: CacheKey, loader: () => Promise<TValue>): Promise<TValue> {
    const entry = store.get(key) as CacheEntry<TValue> | undefined

    if (!entry) {
      return loadAndStore(key, loader)
    }

    entry.lastHit = Date.now()
    return refreshEntity(entry, key, loader)
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
        }
      })

    entry.pendingPromise = refreshPromise
    return refreshPromise
  }

  function commitEntry(entry: CacheEntry, value: unknown) {
    const resolvedAt = Date.now()
    entry.value = value
    entry.resolvedAt = resolvedAt
    entry.lastHit = resolvedAt
    entry.pendingPromise = undefined
  }
}
