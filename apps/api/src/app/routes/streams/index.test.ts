import fastify from 'fastify'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import type { AppType } from '~/app/app'
import { createCache } from '~/app/cache'

const axiosMock = {
  post: vi.fn(),
  get: vi.fn(),
}

vi.mock('axios', () => ({
  default: axiosMock,
}))

vi.mock('~/utils', () => ({
  logger: vi.fn(),
}))

const ORIGINAL_ENV = {
  TWITCH_CLIENT_ID: process.env.TWITCH_CLIENT_ID,
  TWITCH_SECRET: process.env.TWITCH_SECRET,
  YOUTUBE_API_KEY: process.env.YOUTUBE_API_KEY,
  NODE_ENV: process.env.NODE_ENV,
}

beforeEach(() => {
  vi.resetModules()
  axiosMock.post.mockReset()
  axiosMock.get.mockReset()
  process.env.NODE_ENV = 'test'
  process.env.TWITCH_CLIENT_ID = 'twitch-id'
  process.env.TWITCH_SECRET = 'twitch-secret'
  process.env.YOUTUBE_API_KEY = 'youtube-key'
})

afterEach(() => {
  process.env.TWITCH_CLIENT_ID = ORIGINAL_ENV.TWITCH_CLIENT_ID
  process.env.TWITCH_SECRET = ORIGINAL_ENV.TWITCH_SECRET
  process.env.YOUTUBE_API_KEY = ORIGINAL_ENV.YOUTUBE_API_KEY
  process.env.NODE_ENV = ORIGINAL_ENV.NODE_ENV
})

const createTwitchStream = (index: number, viewers = 100 + index) => ({
  id: `stream-${index}`,
  user_login: `login-${index}`,
  user_name: `user-${index}`,
  viewer_count: viewers,
  thumbnail_url: `https://twitch-image/${index}/{width}x{height}`,
})

const createYoutubeVideo = ({
  id,
  title = 'Dungeon Crawl Stone Soup run',
  description = '',
  channelTitle = `YouTube ${id}`,
  concurrentViewers = '250',
  liveBroadcastContent = 'live',
}: {
  id: string
  title?: string
  description?: string
  channelTitle?: string
  concurrentViewers?: string | null
  liveBroadcastContent?: 'live' | 'none' | 'upcoming'
}) => ({
  id,
  snippet: {
    title,
    description,
    channelTitle,
    liveBroadcastContent,
    thumbnails: {
      high: { url: `https://youtube-image/${id}` },
    },
  },
  liveStreamingDetails: concurrentViewers === null ? {} : { concurrentViewers },
})

const mockSuccessfulProviders = ({
  twitchStreams = [createTwitchStream(0)],
  youtubeVideos = [createYoutubeVideo({ id: 'video-0' })],
}: {
  twitchStreams?: ReturnType<typeof createTwitchStream>[]
  youtubeVideos?: ReturnType<typeof createYoutubeVideo>[]
} = {}) => {
  axiosMock.post.mockResolvedValue({
    data: { access_token: 'token-123', expires_in: 60 },
  })
  axiosMock.get.mockImplementation((url: string) => {
    if (url.includes('helix/streams')) {
      return Promise.resolve({ data: { data: twitchStreams } })
    }

    if (url.endsWith('/search')) {
      return Promise.resolve({
        data: {
          items: youtubeVideos.map((video) => ({ id: { videoId: video.id } })),
        },
      })
    }

    if (url.endsWith('/videos')) {
      return Promise.resolve({ data: { items: youtubeVideos } })
    }

    return Promise.reject(new Error(`Unexpected URL: ${url}`))
  })
}

const registerStreamsRoute = async () => {
  const { streamsRoute } = await import('./index')
  const twitchCache = createCache()
  const youtubeCache = createCache()
  const youtubeSearchCache = createCache({ revalidate: 20 * 60 })
  const testApp = fastify() as unknown as AppType
  streamsRoute(testApp, { twitchCache, youtubeCache, youtubeSearchCache })
  await testApp.ready()

  return {
    app: testApp,
    twitchCache,
    youtubeCache,
    youtubeSearchCache,
  }
}

const getAxiosCalls = (urlPart: string) =>
  axiosMock.get.mock.calls.filter(([url]) => String(url).includes(urlPart))

describe('streamsRoute', () => {
  test('returns mocked streams in development when no provider envs are set', async () => {
    process.env.NODE_ENV = 'development'
    delete process.env.TWITCH_CLIENT_ID
    delete process.env.TWITCH_SECRET
    delete process.env.YOUTUBE_API_KEY

    const { app } = await registerStreamsRoute()

    try {
      const response = await app.inject({ method: 'GET', url: '/api/streams' })
      expect(response.statusCode).toBe(200)

      const payload = response.json() as { data: { streams: Array<Record<string, unknown>> } }
      expect(payload.data.streams.length).toBeGreaterThan(0)
      expect(payload.data.streams.length).toBeLessThanOrEqual(10)
      expect(payload.data.streams[0]).toMatchObject({
        platform: 'twitch',
        url: 'https://www.twitch.tv/twitch',
      })
    } finally {
      await app.close()
    }
  })

  test('responds with 404 outside development when no provider envs are set', async () => {
    process.env.NODE_ENV = 'production'
    delete process.env.TWITCH_CLIENT_ID
    delete process.env.TWITCH_SECRET
    delete process.env.YOUTUBE_API_KEY

    const { app } = await registerStreamsRoute()

    try {
      const response = await app.inject({ method: 'GET', url: '/api/streams' })
      expect(response.statusCode).toBe(404)
      expect(response.body).toBe('Stream provider ENVs are not set')
    } finally {
      await app.close()
    }
  })

  test('merges providers, filters YouTube results, and sorts all streams by viewers', async () => {
    mockSuccessfulProviders({
      twitchStreams: [createTwitchStream(0, 100), createTwitchStream(1, 200)],
      youtubeVideos: [
        createYoutubeVideo({ id: 'popular', concurrentViewers: '500' }),
        createYoutubeVideo({
          id: 'hidden-viewers',
          title: 'Friday run',
          description: 'Playing DCSS today',
          concurrentViewers: null,
        }),
        createYoutubeVideo({
          id: 'ended',
          concurrentViewers: '1000',
          liveBroadcastContent: 'none',
        }),
        createYoutubeVideo({
          id: 'unrelated',
          title: 'Unrelated live stream',
          channelTitle: 'Another channel',
          concurrentViewers: '900',
        }),
      ],
    })

    const { app } = await registerStreamsRoute()

    try {
      const response = await app.inject({ method: 'GET', url: '/api/streams' })
      expect(response.statusCode).toBe(200)
      expect(response.json()).toEqual({
        data: {
          streams: [
            {
              id: 'youtube:popular',
              platform: 'youtube',
              username: 'YouTube popular',
              viewers: 500,
              thumbnail: 'https://youtube-image/popular',
              url: 'https://www.youtube.com/watch?v=popular',
            },
            {
              id: 'twitch:stream-1',
              platform: 'twitch',
              username: 'user-1',
              viewers: 200,
              thumbnail: 'https://twitch-image/1/{width}x{height}',
              url: 'https://www.twitch.tv/login-1',
            },
            {
              id: 'twitch:stream-0',
              platform: 'twitch',
              username: 'user-0',
              viewers: 100,
              thumbnail: 'https://twitch-image/0/{width}x{height}',
              url: 'https://www.twitch.tv/login-0',
            },
            {
              id: 'youtube:hidden-viewers',
              platform: 'youtube',
              username: 'YouTube hidden-viewers',
              viewers: null,
              thumbnail: 'https://youtube-image/hidden-viewers',
              url: 'https://www.youtube.com/watch?v=hidden-viewers',
            },
          ],
        },
      })

      expect(getAxiosCalls('/search')[0]?.[1]).toMatchObject({
        params: {
          type: 'video',
          eventType: 'live',
          q: 'Dungeon Crawl Stone Soup|DCSS',
          videoCategoryId: 20,
          order: 'viewCount',
        },
        headers: {
          'X-Goog-Api-Key': 'youtube-key',
        },
      })
    } finally {
      await app.close()
    }
  })

  test('limits the merged provider result rather than each provider independently', async () => {
    mockSuccessfulProviders({
      twitchStreams: Array.from({ length: 10 }, (_, index) => createTwitchStream(index, index)),
      youtubeVideos: [createYoutubeVideo({ id: 'top', concurrentViewers: '1000' })],
    })

    const { app } = await registerStreamsRoute()

    try {
      const response = await app.inject({ method: 'GET', url: '/api/streams' })
      const payload = response.json() as { data: { streams: Array<{ id: string }> } }

      expect(payload.data.streams).toHaveLength(10)
      expect(payload.data.streams[0]?.id).toBe('youtube:top')
      expect(payload.data.streams.map((stream) => stream.id)).not.toContain('twitch:stream-0')
    } finally {
      await app.close()
    }
  })

  test('caches provider data separately from YouTube discovery', async () => {
    mockSuccessfulProviders()
    const { app, twitchCache, youtubeCache } = await registerStreamsRoute()

    try {
      await app.inject({ method: 'GET', url: '/api/streams' })
      await app.inject({ method: 'GET', url: '/api/streams' })

      expect(axiosMock.post).toHaveBeenCalledTimes(1)
      expect(getAxiosCalls('helix/streams')).toHaveLength(1)
      expect(getAxiosCalls('/search')).toHaveLength(1)
      expect(getAxiosCalls('/videos')).toHaveLength(1)

      youtubeCache.clear()
      await app.inject({ method: 'GET', url: '/api/streams' })

      expect(getAxiosCalls('/search')).toHaveLength(1)
      expect(getAxiosCalls('/videos')).toHaveLength(2)
      expect(getAxiosCalls('helix/streams')).toHaveLength(1)

      twitchCache.clear()
      await app.inject({ method: 'GET', url: '/api/streams' })

      expect(axiosMock.post).toHaveBeenCalledTimes(1)
      expect(getAxiosCalls('helix/streams')).toHaveLength(2)
    } finally {
      await app.close()
    }
  })

  test('keeps YouTube streams available when Twitch fails and caches the failure', async () => {
    mockSuccessfulProviders()
    axiosMock.get.mockImplementation((url: string) => {
      if (url.includes('helix/streams')) {
        return Promise.reject(new Error('Twitch unavailable'))
      }

      if (url.endsWith('/search')) {
        return Promise.resolve({ data: { items: [{ id: { videoId: 'video-0' } }] } })
      }

      if (url.endsWith('/videos')) {
        return Promise.resolve({ data: { items: [createYoutubeVideo({ id: 'video-0' })] } })
      }

      return Promise.reject(new Error(`Unexpected URL: ${url}`))
    })

    const { app } = await registerStreamsRoute()

    try {
      const first = await app.inject({ method: 'GET', url: '/api/streams' })
      const second = await app.inject({ method: 'GET', url: '/api/streams' })

      expect(first.statusCode).toBe(200)
      expect(first.json()).toEqual(second.json())
      expect(first.json()).toMatchObject({
        data: {
          streams: [{ id: 'youtube:video-0', platform: 'youtube' }],
        },
      })
      expect(getAxiosCalls('helix/streams')).toHaveLength(1)
    } finally {
      await app.close()
    }
  })

  test('uses Twitch when the YouTube API key is not configured', async () => {
    delete process.env.YOUTUBE_API_KEY
    mockSuccessfulProviders({ youtubeVideos: [] })

    const { app } = await registerStreamsRoute()

    try {
      const response = await app.inject({ method: 'GET', url: '/api/streams' })
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchObject({
        data: {
          streams: [{ id: 'twitch:stream-0', platform: 'twitch' }],
        },
      })
      expect(getAxiosCalls('/search')).toHaveLength(0)
    } finally {
      await app.close()
    }
  })

  test('uses YouTube when Twitch credentials are not configured', async () => {
    delete process.env.TWITCH_CLIENT_ID
    delete process.env.TWITCH_SECRET
    mockSuccessfulProviders()

    const { app } = await registerStreamsRoute()

    try {
      const response = await app.inject({ method: 'GET', url: '/api/streams' })
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchObject({
        data: {
          streams: [{ id: 'youtube:video-0', platform: 'youtube' }],
        },
      })
      expect(axiosMock.post).not.toHaveBeenCalled()
      expect(getAxiosCalls('helix/streams')).toHaveLength(0)
    } finally {
      await app.close()
    }
  })

  test('caches an unsuccessful YouTube search for the discovery interval', async () => {
    delete process.env.TWITCH_CLIENT_ID
    delete process.env.TWITCH_SECRET
    axiosMock.get.mockRejectedValue(new Error('YouTube unavailable'))

    const { app, youtubeCache } = await registerStreamsRoute()

    try {
      const first = await app.inject({ method: 'GET', url: '/api/streams' })
      youtubeCache.clear()
      const second = await app.inject({ method: 'GET', url: '/api/streams' })

      expect(first.statusCode).toBe(200)
      expect(first.json()).toEqual({ data: { streams: [] } })
      expect(second.json()).toEqual(first.json())
      expect(getAxiosCalls('/search')).toHaveLength(1)
    } finally {
      await app.close()
    }
  })

  test('refreshes the Twitch token when it is about to expire', async () => {
    delete process.env.YOUTUBE_API_KEY
    axiosMock.post
      .mockResolvedValueOnce({
        data: { access_token: 'token-old', expires_in: 9 },
      })
      .mockResolvedValueOnce({
        data: { access_token: 'token-new', expires_in: 9 },
      })
    axiosMock.get.mockResolvedValue({ data: { data: [createTwitchStream(1)] } })

    const { app, twitchCache } = await registerStreamsRoute()

    try {
      await app.inject({ method: 'GET', url: '/api/streams' })
      twitchCache.clear()
      await app.inject({ method: 'GET', url: '/api/streams' })

      expect(axiosMock.post).toHaveBeenCalledTimes(2)
      expect(axiosMock.get).toHaveBeenCalledTimes(2)
      expect(axiosMock.get.mock.calls.at(1)?.[1].headers.Authorization).toBe('Bearer token-new')
    } finally {
      await app.close()
    }
  })

  test('reuses the existing Twitch token when it is still valid', async () => {
    delete process.env.YOUTUBE_API_KEY
    axiosMock.post.mockResolvedValue({
      data: { access_token: 'token-stable', expires_in: 600 },
    })
    axiosMock.get.mockResolvedValue({ data: { data: [createTwitchStream(2)] } })

    const { app, twitchCache } = await registerStreamsRoute()

    try {
      await app.inject({ method: 'GET', url: '/api/streams' })
      twitchCache.clear()
      await app.inject({ method: 'GET', url: '/api/streams' })

      expect(axiosMock.post).toHaveBeenCalledTimes(1)
      expect(axiosMock.get).toHaveBeenCalledTimes(2)
      expect(axiosMock.get.mock.calls.at(1)?.[1].headers.Authorization).toBe('Bearer token-stable')
    } finally {
      await app.close()
    }
  })
})
