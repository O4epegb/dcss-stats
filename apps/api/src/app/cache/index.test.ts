import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { createCache, defaultCacheOptions, getRouteCacheKey } from '~/app/cache'

const flushMicrotasks = async () => {
  await Promise.resolve()
  await Promise.resolve()
}

const advanceSeconds = (seconds: number) => {
  vi.advanceTimersByTime(seconds * 1000)
}

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('createCache', () => {
  test('deduplicates inflight requests for the same key', async () => {
    const cache = createCache({ revalidate: Infinity, expire: 10, maxEntries: 1 })
    const deferred = Promise.withResolvers<string>()
    const loader = vi.fn<() => Promise<string>>().mockReturnValue(deferred.promise)

    const first = cache.get({ key: 'players', loader })
    expect(await cache.get({ key: 'other', loader: async () => 'other' })).toBe('other')
    advanceSeconds(11)
    const second = cache.get({ key: 'players', loader })

    expect(loader).toHaveBeenCalledTimes(1)

    deferred.resolve('ok')

    await expect(first).resolves.toBe('ok')
    await expect(second).resolves.toBe('ok')

    advanceSeconds(9)
    expect(await cache.get({ key: 'players', loader })).toBe('ok')
    expect(loader).toHaveBeenCalledTimes(1)
  })

  test('serves stale values while revalidating in the background', async () => {
    const cache = createCache({ revalidate: 10, expire: Infinity })
    const loader = vi
      .fn<() => Promise<string>>()
      .mockResolvedValueOnce('initial')
      .mockResolvedValueOnce('revalidated')

    expect(await cache.get({ key: 'matrix', loader })).toBe('initial')

    advanceSeconds(11)

    expect(await cache.get({ key: 'matrix', loader })).toBe('initial')
    expect(loader).toHaveBeenCalledTimes(2)

    await flushMicrotasks()

    expect(await cache.get({ key: 'matrix', loader })).toBe('revalidated')
  })

  test('expires values by age despite traffic and shares blocking refreshes', async () => {
    const cache = createCache({ revalidate: 30, expire: 30 })
    const refresh = Promise.withResolvers<string>()
    const loader = vi
      .fn<() => Promise<string>>()
      .mockResolvedValueOnce('initial')
      .mockReturnValueOnce(refresh.promise)
      .mockResolvedValueOnce('next')

    expect(await cache.get({ key: 'top', loader })).toBe('initial')

    advanceSeconds(20)
    expect(await cache.get({ key: 'top', loader })).toBe('initial')
    advanceSeconds(9)
    expect(await cache.get({ key: 'top', loader })).toBe('initial')
    expect(loader).toHaveBeenCalledTimes(1)

    advanceSeconds(1)
    const first = cache.get({ key: 'top', loader })
    const second = cache.get({ key: 'top', loader })
    const settled = vi.fn()
    void first.then(settled)
    await flushMicrotasks()

    expect(settled).not.toHaveBeenCalled()
    expect(loader).toHaveBeenCalledTimes(2)

    refresh.resolve('recomputed')
    await expect(first).resolves.toBe('recomputed')
    await expect(second).resolves.toBe('recomputed')

    advanceSeconds(29)
    expect(await cache.get({ key: 'top', loader })).toBe('recomputed')
    advanceSeconds(1)
    expect(await cache.get({ key: 'top', loader })).toBe('next')
    expect(loader).toHaveBeenCalledTimes(3)
  })

  test('skipCache refreshes the normalized route key and backfills the latest value', async () => {
    const cache = createCache({ expire: Infinity })
    const loader = vi
      .fn<() => Promise<string>>()
      .mockResolvedValueOnce('cached')
      .mockResolvedValueOnce('bypass')
      .mockResolvedValueOnce('should-not-be-used')

    const key = getRouteCacheKey('/api/top?since=2026-01-01&minGamesThresholdForWinrate=75', {
      since: '2026-01-01',
      minGamesThresholdForWinrate: 75,
    })
    const refreshKey = getRouteCacheKey('/api/top?noCache=true', {
      noCache: 'true',
      minGamesThresholdForWinrate: 75,
      since: '2026-01-01',
    })
    expect(refreshKey).toBe(key)
    expect(await cache.get({ key, loader })).toBe('cached')

    expect(await cache.get({ key: refreshKey, loader, skipCache: true })).toBe('bypass')
    expect(loader).toHaveBeenCalledTimes(2)

    expect(await cache.get({ key, loader })).toBe('bypass')
    expect(loader).toHaveBeenCalledTimes(2)
  })

  test('skipCache deduplicates concurrent refreshes', async () => {
    const cache = createCache({ expire: Infinity })
    const refresh = Promise.withResolvers<string>()
    const loader = vi
      .fn<() => Promise<string>>()
      .mockResolvedValueOnce('cached')
      .mockReturnValueOnce(refresh.promise)

    await cache.get({ key: 'supporters', loader })

    const first = cache.get({ key: 'supporters', loader, skipCache: true })
    const second = cache.get({ key: 'supporters', loader, skipCache: true })

    expect(loader).toHaveBeenCalledTimes(2)
    expect(first).toStrictEqual(second)

    refresh.resolve('refreshed')
    await expect(first).resolves.toBe('refreshed')
    expect(await cache.get({ key: 'supporters', loader })).toBe('refreshed')
  })

  test('skipCache keeps the previous value when refresh fails', async () => {
    const cache = createCache({ expire: Infinity })
    const error = new Error('refresh failed')
    const loader = vi
      .fn<() => Promise<string>>()
      .mockResolvedValueOnce('cached')
      .mockRejectedValueOnce(error)

    await cache.get({ key: 'supporters', loader })

    await expect(cache.get({ key: 'supporters', loader, skipCache: true })).rejects.toThrow(error)
    expect(await cache.get({ key: 'supporters', loader })).toBe('cached')
  })

  test('normal requests share the revalidation promise across expiration', async () => {
    const cache = createCache({ revalidate: 10, expire: 30 })
    const refresh = Promise.withResolvers<string>()
    const loader = vi
      .fn<() => Promise<string>>()
      .mockResolvedValueOnce('initial')
      .mockReturnValueOnce(refresh.promise)

    await cache.get({ key: 'matrix', loader })

    advanceSeconds(11)

    const staleResponse = cache.get({ key: 'matrix', loader })
    const pending = cache.get({ key: 'matrix', loader })

    expect(loader).toHaveBeenCalledTimes(2)
    await expect(staleResponse).resolves.toBe('initial')

    advanceSeconds(20)
    const expired = cache.get({ key: 'matrix', loader })
    expect(loader).toHaveBeenCalledTimes(2)

    refresh.resolve('fresh')
    await expect(pending).resolves.toBe('fresh')
    await expect(expired).resolves.toBe('fresh')
  })

  test('normal revalidation failure serves the previous value only before expiration', async () => {
    const cache = createCache({ revalidate: 5, expire: 10 })
    const error = new Error('boom')
    const loader = vi
      .fn<() => Promise<string>>()
      .mockResolvedValueOnce('initial')
      .mockRejectedValueOnce(error)
      .mockResolvedValueOnce('recovered')
      .mockRejectedValueOnce(error)
      .mockResolvedValueOnce('fresh')

    await cache.get({ key: 'matrix', loader })
    advanceSeconds(6)

    const staleResponse = cache.get({ key: 'matrix', loader })
    const pending = cache.get({ key: 'matrix', loader })

    await expect(staleResponse).resolves.toBe('initial')
    await expect(pending).rejects.toThrow(error)

    const nextStale = cache.get({ key: 'matrix', loader })
    await expect(nextStale).resolves.toBe('initial')

    await flushMicrotasks()
    expect(await cache.get({ key: 'matrix', loader })).toBe('recovered')

    advanceSeconds(10)
    await expect(cache.get({ key: 'matrix', loader })).rejects.toThrow(error)
    expect(await cache.get({ key: 'matrix', loader })).toBe('fresh')
    expect(loader).toHaveBeenCalledTimes(5)
  })

  test('evicts least recently used entries and supports clearing keys or the entire store', async () => {
    const cache = createCache({ expire: Infinity, maxEntries: 2 })
    const loader = vi
      .fn<() => Promise<string>>()
      .mockResolvedValueOnce('first')
      .mockResolvedValueOnce('second')
      .mockResolvedValueOnce('third')
      .mockResolvedValueOnce('fourth')
      .mockResolvedValueOnce('fifth')
      .mockResolvedValueOnce('sixth')

    expect(await cache.get({ key: 'matrix', loader })).toBe('first')
    cache.clear('matrix')
    expect(await cache.get({ key: 'matrix', loader })).toBe('second')

    expect(await cache.get({ key: 'players', loader })).toBe('third')
    expect(await cache.get({ key: 'matrix', loader })).toBe('second')
    expect(await cache.get({ key: 'top', loader })).toBe('fourth')
    expect(await cache.get({ key: 'matrix', loader })).toBe('second')
    expect(await cache.get({ key: 'players', loader })).toBe('fifth')

    cache.clear()
    expect(await cache.get({ key: 'players', loader })).toBe('sixth')

    expect(loader).toHaveBeenCalledTimes(6)
  })

  test('applies the default revalidation window of 300 seconds', async () => {
    const cache = createCache({ expire: Infinity })
    const loader = vi
      .fn<() => Promise<string>>()
      .mockResolvedValueOnce('initial')
      .mockResolvedValueOnce('revalidated')

    expect(await cache.get({ key: 'matrix', loader })).toBe('initial')

    advanceSeconds(defaultCacheOptions.revalidate - 1)
    expect(await cache.get({ key: 'matrix', loader })).toBe('initial')
    expect(loader).toHaveBeenCalledTimes(1)

    advanceSeconds(1)
    expect(await cache.get({ key: 'matrix', loader })).toBe('initial')
    expect(loader).toHaveBeenCalledTimes(2)
  })

  test('never expires entries when expire is explicitly Infinity', async () => {
    const cache = createCache({ revalidate: Infinity, expire: Infinity })
    const loader = vi.fn<() => Promise<string>>().mockResolvedValue('stable')

    expect(await cache.get({ key: 'supporters', loader })).toBe('stable')

    advanceSeconds(60 * 60 * 24)

    expect(await cache.get({ key: 'supporters', loader })).toBe('stable')
    expect(loader).toHaveBeenCalledTimes(1)
  })
})
