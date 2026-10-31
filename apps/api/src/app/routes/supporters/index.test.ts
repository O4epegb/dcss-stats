import dayjs from 'dayjs'
import fastify from 'fastify'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import type { AppType } from '~/app/app'
import { createCache } from '~/app/cache'

const axiosMock = {
  get: vi.fn(),
}

vi.mock('axios', () => ({
  default: axiosMock,
}))

const trackError = vi.fn()
vi.mock('~/utils', () => ({
  trackError,
}))

const ORIGINAL_ENV = {
  BUYMEACOFFEE_TOKEN: process.env.BUYMEACOFFEE_TOKEN,
  GITHUB_SPONSORS_TOKEN: process.env.GITHUB_SPONSORS_TOKEN,
}

beforeEach(() => {
  vi.resetModules()
  axiosMock.get.mockReset()
  trackError.mockReset()
  process.env.BUYMEACOFFEE_TOKEN = 'token-123'
  delete process.env.GITHUB_SPONSORS_TOKEN
})

afterEach(() => {
  for (const [key, value] of Object.entries(ORIGINAL_ENV)) {
    if (value === undefined) delete process.env[key]
    else process.env[key] = value
  }
})

const createSubscriptionsResponse = <T>(data: T[] = []) => ({
  data: {
    data,
    current_page: 1,
    last_page: 1,
  },
})

const createSupportersResponse = <T>(data: T[] = [], page = 1, lastPage = 1) => ({
  data: {
    data,
    current_page: page,
    last_page: lastPage,
  },
})

const registerSupportersRoute = async () => {
  const { supportersRoute } = await import('./index')
  const cache = createCache()
  const app = fastify() as unknown as AppType
  supportersRoute(app, { cache })
  await app.ready()
  return { app, cache }
}

describe('supportersRoute', () => {
  test('returns 404 when BUYMEACOFFEE token is missing', async () => {
    delete process.env.BUYMEACOFFEE_TOKEN
    const { app } = await registerSupportersRoute()

    try {
      const response = await app.inject({ method: 'GET', url: '/api/supporters' })
      expect(response.statusCode).toBe(404)
      expect(response.body).toBe('Token ENV is not set')
      expect(axiosMock.get).not.toHaveBeenCalled()
    } finally {
      await app.close()
    }
  })

  test('returns aggregate totals for /api/supporters/current', async () => {
    const subscription = {
      subscription_id: 1,
      subscription_created_on: '2026-10-01T00:00:00Z',
      subscription_current_period_start: '2026-10-01T00:00:00Z',
      subscription_current_period_end: '2026-11-01T00:00:00Z',
      subscription_coffee_price: '10',
      subscription_currency: 'USD',
      subscription_duration_type: 'monthly',
    }
    const supporter = {
      support_id: 1,
      support_coffees: 2,
      support_coffee_price: '3.5',
      support_currency: 'USD',
      support_created_on: dayjs().subtract(7, 'day').toISOString(),
    }

    axiosMock.get
      .mockResolvedValueOnce(createSubscriptionsResponse([subscription]))
      .mockResolvedValueOnce(createSupportersResponse([supporter]))

    const { app } = await registerSupportersRoute()

    try {
      const response = await app.inject({ method: 'GET', url: '/api/supporters/current' })
      expect(response.statusCode).toBe(200)

      expect(response.json()).toEqual({
        total: 17,
        goal: 20,
      })
      expect(axiosMock.get).toHaveBeenCalledTimes(2)
    } finally {
      await app.close()
    }
  })

  test('logs and returns 500 when supporters endpoint responds with error', async () => {
    axiosMock.get
      .mockResolvedValueOnce(createSubscriptionsResponse([]))
      .mockResolvedValueOnce({ data: { error: 'bad request' } })

    const { app } = await registerSupportersRoute()

    try {
      const response = await app.inject({ method: 'GET', url: '/api/supporters/current' })
      expect(response.statusCode).toBe(500)
      expect(response.json()).toEqual({ error: 'bad request' })
      expect(trackError).toHaveBeenCalledWith(new Error('bad request'))
    } finally {
      await app.close()
    }
  })

  test('returns enriched supporters list', async () => {
    const supporters = [
      {
        support_id: 1,
        support_coffees: 1,
        support_coffee_price: '5',
        support_currency: 'USD',
        support_created_on: dayjs('2024-01-01').toISOString(),
      },
    ]
    const subscriptions = [
      {
        subscription_id: 'sub-1',
        subscription_coffee_price: '3',
        subscription_currency: 'USD',
        subscription_created_on: dayjs('2024-01-05').toISOString(),
        subscription_current_period_start: dayjs().subtract(1, 'month').toISOString(),
        subscription_current_period_end: dayjs().add(1, 'month').toISOString(),
        subscription_duration_type: 'monthly',
      },
    ]

    axiosMock.get
      .mockResolvedValueOnce(createSubscriptionsResponse(subscriptions))
      .mockResolvedValueOnce(createSupportersResponse(supporters, 1, 2))
      .mockResolvedValueOnce(
        createSupportersResponse(
          [{ ...supporters[0], support_id: 2, support_created_on: '2023-01-01T00:00:00Z' }],
          2,
          2,
        ),
      )

    const { app } = await registerSupportersRoute()

    try {
      const response = await app.inject({ method: 'GET', url: '/api/supporters' })
      expect(response.statusCode).toBe(200)

      const payload = response.json() as {
        oneTimeDonations: Array<Record<string, unknown>>
        subscriptionDonations: Array<Record<string, unknown>>
      }

      expect(payload.oneTimeDonations).toHaveLength(4)
      expect(payload.oneTimeDonations[0]).toMatchObject({
        id: 'bitcoin-1',
        amount: 20,
        currency: 'USD',
        createdAt: '2026-04-05T00:00:00.000Z',
        source: 'bitcoin',
      })
      expect(payload.oneTimeDonations[1]).toMatchObject({
        id: 'kofi-1',
        source: 'kofi',
      })
      expect(payload.oneTimeDonations[2]).toMatchObject({
        id: '1',
        amount: 5,
        source: 'buymeacoffee',
      })
      expect(payload.oneTimeDonations[3]).toMatchObject({ id: '2', source: 'buymeacoffee' })
      expect(axiosMock.get).toHaveBeenLastCalledWith(
        'https://developers.buymeacoffee.com/api/v1/supporters',
        expect.objectContaining({ params: { page: 2 } }),
      )

      expect(payload.subscriptionDonations).toHaveLength(1)
      expect(payload.subscriptionDonations[0]).toMatchObject({
        id: 'sub-1',
        amount: 3,
        source: 'buymeacoffee',
        isActiveNow: true,
      })
    } finally {
      await app.close()
    }
  })
})
