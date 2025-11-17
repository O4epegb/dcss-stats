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

type CacheEntry = {
  promise: Promise<unknown>
  value?: unknown
  resolvedAt?: number
  lastHit: number
  revalidatePromise?: Promise<unknown>
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
    get<TValue>({ key, loader, skipCache }: CacheRequest<TValue>): Promise<TValue> {
      if (skipCache) {
        return loadWithoutCache(key, loader)
      }

      const entry = store.get(key)
      const now = Date.now()

      if (!entry) {
        return loadAndShare(key, loader)
      }

      if (expireMs !== Infinity && now - entry.lastHit >= expireMs) {
        store.delete(key)
        return loadAndShare(key, loader)
      }

      entry.lastHit = now

      if (!entry.value) {
        return entry.promise as Promise<TValue>
      }

      if (
        revalidateMs !== Infinity &&
        entry.resolvedAt !== undefined &&
        now - entry.resolvedAt >= revalidateMs
      ) {
        triggerRevalidation(entry, key, loader)
      }

      return entry.promise as Promise<TValue>
    },
    clear(key?: CacheKey) {
      if (key) {
        store.delete(key)
      } else {
        store.clear()
      }
    },
  }

  function loadAndShare<TValue>(key: CacheKey, loader: () => Promise<TValue>): Promise<TValue> {
    const now = Date.now()
    const loaderPromise = loader()
    const entry: CacheEntry = {
      promise: loaderPromise,
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

  function loadWithoutCache<TValue>(key: CacheKey, loader: () => Promise<TValue>): Promise<TValue> {
    const existing = store.get(key)

    if (existing) {
      existing.lastHit = Date.now()
    }

    return loader().then((value) => {
      const entry = store.get(key)

      if (entry) {
        commitEntry(entry, value)
      } else {
        const resolvedEntry: CacheEntry = {
          value,
          resolvedAt: Date.now(),
          lastHit: Date.now(),
          promise: Promise.resolve(value),
        }

        store.set(key, resolvedEntry)
      }

      return value
    })
  }

  function triggerRevalidation<TValue>(
    entry: CacheEntry,
    key: CacheKey,
    loader: () => Promise<TValue>,
  ): void {
    if (entry.revalidatePromise) {
      return
    }

    const revalidatePromise = loader()
      .then((value) => {
        if (store.get(key) !== entry) {
          return value
        }

        commitEntry(entry, value)
        entry.revalidatePromise = undefined
        return value
      })
      .catch(() => {
        if (store.get(key) === entry) {
          store.delete(key)
        }

        entry.revalidatePromise = undefined
      })

    entry.revalidatePromise = revalidatePromise
  }

  function commitEntry(entry: CacheEntry, value: unknown) {
    const resolvedAt = Date.now()
    entry.value = value
    entry.resolvedAt = resolvedAt
    entry.lastHit = resolvedAt
    entry.promise = Promise.resolve(value)
    entry.revalidatePromise = undefined
  }
}
