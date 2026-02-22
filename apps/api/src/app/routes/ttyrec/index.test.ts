import fastify from 'fastify'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import type { AppType } from '~/app/app'

const {
  prismaMock,
  decodeTtyrecFromUrlMock,
  getTtyrecBufferFromUrlMock,
  extractTimestampDataFromUrlMock,
} = vi.hoisted(() => ({
  prismaMock: {
    server: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
    },
    game: {
      findFirst: vi.fn(),
    },
  },
  decodeTtyrecFromUrlMock: vi.fn(),
  getTtyrecBufferFromUrlMock: vi.fn(),
  extractTimestampDataFromUrlMock: vi.fn(),
}))

vi.mock('~/prisma', () => ({
  prisma: prismaMock,
}))

vi.mock('~/app/utils/ttyrec', () => ({
  decodeTtyrecFromUrl: decodeTtyrecFromUrlMock,
  getTtyrecBufferFromUrl: getTtyrecBufferFromUrlMock,
  extractTimestampDataFromUrl: extractTimestampDataFromUrlMock,
}))

const registerTtyrecRoute = async () => {
  const { ttyrecRoute } = await import('./index')
  const app = fastify() as unknown as AppType
  ttyrecRoute(app)
  await app.ready()
  return app
}

describe('ttyrecRoute url validation', () => {
  beforeEach(() => {
    vi.resetModules()
    prismaMock.server.findMany.mockReset()
    prismaMock.server.findFirst.mockReset()
    prismaMock.game.findFirst.mockReset()
    decodeTtyrecFromUrlMock.mockReset()
    getTtyrecBufferFromUrlMock.mockReset()
    extractTimestampDataFromUrlMock.mockReset()

    prismaMock.server.findMany.mockResolvedValue([
      {
        abbreviation: 'CAO',
        baseUrl: 'https://crawl.akrasiac.org',
      },
    ])
  })

  test.each([
    {
      routeUrl: '/api/ttyrec/decode?url=https://example.com/file.ttyrec',
      utilMock: decodeTtyrecFromUrlMock,
    },
    {
      routeUrl: '/api/ttyrec/raw?url=https://example.com/file.ttyrec',
      utilMock: getTtyrecBufferFromUrlMock,
    },
    {
      routeUrl: '/api/ttyrec/extract-timestamps?url=https://example.com/file.timestamps',
      utilMock: extractTimestampDataFromUrlMock,
    },
  ])('rejects unknown server host for $routeUrl', async ({ routeUrl, utilMock }) => {
    const app = await registerTtyrecRoute()

    try {
      const response = await app.inject({ method: 'GET', url: routeUrl })

      expect(response.statusCode).toBe(400)
      expect(response.body).toBe('Invalid ttyrec url')
      expect(utilMock).not.toHaveBeenCalled()
    } finally {
      await app.close()
    }
  })

  test.each([
    '/api/ttyrec/decode?url=not-a-url',
    '/api/ttyrec/raw?url=not-a-url',
    '/api/ttyrec/extract-timestamps?url=not-a-url',
  ])('rejects malformed url for %s', async (routeUrl) => {
    const app = await registerTtyrecRoute()

    try {
      const response = await app.inject({ method: 'GET', url: routeUrl })

      expect(response.statusCode).toBe(400)
      expect(prismaMock.server.findMany).not.toHaveBeenCalled()
      expect(decodeTtyrecFromUrlMock).not.toHaveBeenCalled()
      expect(getTtyrecBufferFromUrlMock).not.toHaveBeenCalled()
      expect(extractTimestampDataFromUrlMock).not.toHaveBeenCalled()
    } finally {
      await app.close()
    }
  })
})
