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
  NODE_ENV: process.env.NODE_ENV,
}

beforeEach(() => {
  vi.resetModules()
  axiosMock.post.mockReset()
  axiosMock.get.mockReset()
  process.env.NODE_ENV = 'test'
  process.env.TWITCH_CLIENT_ID = 'id'
  process.env.TWITCH_SECRET = 'secret'
})

afterEach(() => {
  process.env.TWITCH_CLIENT_ID = ORIGINAL_ENV.TWITCH_CLIENT_ID
  process.env.TWITCH_SECRET = ORIGINAL_ENV.TWITCH_SECRET
  process.env.NODE_ENV = ORIGINAL_ENV.NODE_ENV
})

const createTwitchStream = (index: number) => ({
  user_login: `login-${index}`,
  user_name: `user-${index}`,
  viewer_count: 100 + index,
  thumbnail_url: `https://image/${index}`,
})

const registerStreamsRoute = async () => {
  const { streamsRoute } = await import('./index')
  const cache = createCache()
  const testApp = fastify() as unknown as AppType
  streamsRoute(testApp, { cache })
  await testApp.ready()
  return { app: testApp, cache }
}

describe('streamsRoute', () => {
  test('returns mocked streams in development when Twitch envs are missing', async () => {
    process.env.NODE_ENV = 'development'
    delete process.env.TWITCH_CLIENT_ID
    delete process.env.TWITCH_SECRET

    const { app } = await registerStreamsRoute()

    try {
      const response = await app.inject({ method: 'GET', url: '/api/streams' })
      expect(response.statusCode).toBe(200)

      const payload = response.json() as { data: { streams: Array<Record<string, unknown>> } }
      expect(Array.isArray(payload.data.streams)).toBe(true)
      expect(payload.data.streams.length).toBeGreaterThan(0)
      expect(payload.data.streams.length).toBeLessThanOrEqual(10)
    } finally {
      await app.close()
    }
  })

  test('responds with 404 outside development when Twitch envs are missing', async () => {
    process.env.NODE_ENV = 'production'
    delete process.env.TWITCH_CLIENT_ID
    delete process.env.TWITCH_SECRET

    const { app } = await registerStreamsRoute()

    try {
      const response = await app.inject({ method: 'GET', url: '/api/streams' })
      expect(response.statusCode).toBe(404)
      expect(response.body).toBe('Twitch ENVs are not set')
    } finally {
      await app.close()
    }
  })

  test('fetches Twitch streams once and reuses the cached payload', async () => {
    axiosMock.post.mockResolvedValue({
      data: { access_token: 'token-123', expires_in: 60_000 },
    })
    axiosMock.get.mockResolvedValue({
      data: {
        data: Array.from({ length: 12 }, (_, index) => createTwitchStream(index)),
      },
    })

    const { app } = await registerStreamsRoute()

    try {
      const first = await app.inject({ method: 'GET', url: '/api/streams' })
      expect(first.statusCode).toBe(200)

      const firstPayload = first.json() as { data: { streams: Array<Record<string, unknown>> } }
      expect(firstPayload.data.streams).toHaveLength(10)
      expect(firstPayload.data.streams[0]).toMatchObject({
        username: 'user-0',
        login: 'login-0',
        thumbnail: 'https://image/0',
      })

      const second = await app.inject({ method: 'GET', url: '/api/streams' })
      expect(second.statusCode).toBe(200)
      expect(second.json()).toEqual(firstPayload)

      expect(axiosMock.post).toHaveBeenCalledTimes(1)
      expect(axiosMock.get).toHaveBeenCalledTimes(1)
    } finally {
      await app.close()
    }
  })

  test('refreshes the Twitch token when it is about to expire', async () => {
    axiosMock.post
      .mockResolvedValueOnce({
        data: { access_token: 'token-old', expires_in: 9_000 },
      })
      .mockResolvedValueOnce({
        data: { access_token: 'token-new', expires_in: 9_000 },
      })

    axiosMock.get.mockResolvedValue({
      data: {
        data: [createTwitchStream(1)],
      },
    })

    const { app, cache } = await registerStreamsRoute()

    try {
      await app.inject({ method: 'GET', url: '/api/streams' })
      cache.clear()
      await app.inject({ method: 'GET', url: '/api/streams' })

      expect(axiosMock.post).toHaveBeenCalledTimes(2)
      expect(axiosMock.get).toHaveBeenCalledTimes(2)

      const secondCall = axiosMock.get.mock.calls.at(1)
      expect(secondCall).toBeDefined()
      expect(secondCall![1].headers.Authorization).toBe('Bearer token-new')
    } finally {
      await app.close()
    }
  })

  test('reuses the existing Twitch token when it is still valid', async () => {
    axiosMock.post.mockResolvedValue({
      data: { access_token: 'token-stable', expires_in: 600_000 },
    })

    axiosMock.get.mockResolvedValue({
      data: {
        data: [createTwitchStream(2)],
      },
    })

    const { app, cache } = await registerStreamsRoute()

    try {
      await app.inject({ method: 'GET', url: '/api/streams' })
      cache.clear()
      await app.inject({ method: 'GET', url: '/api/streams' })

      expect(axiosMock.post).toHaveBeenCalledTimes(1)
      expect(axiosMock.get).toHaveBeenCalledTimes(2)

      const secondCall = axiosMock.get.mock.calls.at(1)
      expect(secondCall).toBeDefined()
      expect(secondCall![1].headers.Authorization).toBe('Bearer token-stable')
    } finally {
      await app.close()
    }
  })
})
