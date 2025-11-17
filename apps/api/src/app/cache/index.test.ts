import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { createCache, defaultCacheOptions } from '~/app/cache'

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
    const cache = createCache()
    const deferred = Promise.withResolvers<string>()
    const loader = vi.fn<() => Promise<string>>().mockReturnValue(deferred.promise)

    const first = cache.get({ key: 'players', loader })
    const second = cache.get({ key: 'players', loader })

    expect(loader).toHaveBeenCalledTimes(1)

    deferred.resolve('ok')

    await expect(first).resolves.toBe('ok')
    await expect(second).resolves.toBe('ok')
  })

  test('serves stale values while revalidating in the background', async () => {
    const cache = createCache({ revalidate: 10 })
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

  test('drops entries that receive no traffic before the expire window', async () => {
    const cache = createCache({ revalidate: 10, expire: 30 })
    const loader = vi
      .fn<() => Promise<string>>()
      .mockResolvedValueOnce('initial')
      .mockResolvedValueOnce('recomputed')

    expect(await cache.get({ key: 'top', loader })).toBe('initial')

    advanceSeconds(31)

    expect(await cache.get({ key: 'top', loader })).toBe('recomputed')
    expect(loader).toHaveBeenCalledTimes(2)
  })

  test('skipCache bypasses the store but backfills the latest value', async () => {
    const cache = createCache()
    const loader = vi
      .fn<() => Promise<string>>()
      .mockResolvedValueOnce('cached')
      .mockResolvedValueOnce('bypass')
      .mockResolvedValueOnce('should-not-be-used')

    expect(await cache.get({ key: 'supporters', loader })).toBe('cached')

    expect(await cache.get({ key: 'supporters', loader, skipCache: true })).toBe('bypass')
    expect(loader).toHaveBeenCalledTimes(2)

    expect(await cache.get({ key: 'supporters', loader })).toBe('bypass')
    expect(loader).toHaveBeenCalledTimes(2)
  })

  test('clear removes individual keys as well as the entire store', async () => {
    const cache = createCache()
    const loader = vi
      .fn<() => Promise<string>>()
      .mockResolvedValueOnce('first')
      .mockResolvedValueOnce('second')
      .mockResolvedValueOnce('third')
      .mockResolvedValueOnce('fourth')

    expect(await cache.get({ key: 'matrix', loader })).toBe('first')
    cache.clear('matrix')
    expect(await cache.get({ key: 'matrix', loader })).toBe('second')

    expect(await cache.get({ key: 'players', loader })).toBe('third')
    cache.clear()
    expect(await cache.get({ key: 'players', loader })).toBe('fourth')

    expect(loader).toHaveBeenCalledTimes(4)
  })

  test('applies the default revalidation window of 300 seconds', async () => {
    const cache = createCache()
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

  test('never expires entries when expire is not provided', async () => {
    // Use a huge revalidation window so we can focus on the absence of expire.
    const cache = createCache({ revalidate: Number.MAX_SAFE_INTEGER })
    const loader = vi.fn<() => Promise<string>>().mockResolvedValue('stable')

    expect(await cache.get({ key: 'supporters', loader })).toBe('stable')

    advanceSeconds(60 * 60 * 24)

    expect(await cache.get({ key: 'supporters', loader })).toBe('stable')
    expect(loader).toHaveBeenCalledTimes(1)
  })
})
