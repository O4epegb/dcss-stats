import fastify from 'fastify'
import qs from 'qs'
import { describe, expect, test, vi } from 'vitest'
import type { AppType } from '~/app/app'
import { getFilterOptions, getWhereQueryFromFilter, searchRoute } from '~/app/routes/search'
import { staticDataRoute } from '~/app/routes/static-data'
import { prisma } from '~/prisma'

vi.mock('~/app/getters/getStaticData', () => ({
  getStaticData: async () => ({
    races: [],
    classes: [],
    gods: [],
    versions: [],
    servers: [],
  }),
}))

vi.mock('~/prisma', () => ({
  prisma: {
    game: {
      count: vi.fn(async () => 0),
      findMany: vi.fn(async () => []),
    },
  },
}))

const durationFilter = (condition: string, value: string) => ({
  option: 'Duration',
  condition,
  value,
  operator: 'and',
})

describe('duration search filter', () => {
  test.each([
    ['>=', 'gte'],
    ['<=', 'lte'],
    ['>', 'gt'],
    ['<', 'lt'],
    ['=', 'equals'],
  ])('maps %s to a numeric %s comparison in seconds', async (condition, comparison) => {
    expect(await getWhereQueryFromFilter([durationFilter(condition, '3600')])).toEqual({
      AND: [{ duration: { [comparison]: 3600 } }],
    })
  })

  test('allows zero seconds and durations longer than a day', async () => {
    expect(
      await getWhereQueryFromFilter([durationFilter('>=', '0'), durationFilter('<=', '172800')]),
    ).toEqual({
      AND: [{ duration: { gte: 0 } }, { duration: { lte: 172800 } }],
    })
  })

  test('combines a duration range with an existing numeric filter', async () => {
    expect(
      await getWhereQueryFromFilter([
        durationFilter('>=', '60'),
        durationFilter('<=', '3600'),
        { option: 'Turns', condition: '<', value: '10000', operator: 'and' },
      ]),
    ).toEqual({
      AND: [{ duration: { gte: 60 } }, { duration: { lte: 3600 } }, { turns: { lt: 10000 } }],
    })
  })

  test('rejects unsupported duration comparisons', async () => {
    await expect(getWhereQueryFromFilter([durationFilter('contains', '3600')])).rejects.toThrow(
      'Invalid filter',
    )
  })

  test('advertises seconds and the numeric comparisons to the frontend', async () => {
    const app = fastify()
    staticDataRoute(app as AppType)

    try {
      const response = await app.inject({ method: 'GET', url: '/api/static-data' })
      expect(response.statusCode).toBe(200)
      expect(response.json().filterOptions).toContainEqual({
        name: 'Duration',
        type: 'number',
        suboptions: [],
        conditions: ['>=', '<=', '>', '<', '='],
        placeholder: 'Enter seconds',
        values: [],
      })
      expect(
        (await getFilterOptions()).find((option) => option.queryName === 'Duration'),
      ).toMatchObject({
        dbField: 'duration',
      })
    } finally {
      await app.close()
    }
  })

  test('passes the duration constraint to both result and count queries', async () => {
    const app = fastify({ routerOptions: { querystringParser: (query) => qs.parse(query) } })
    searchRoute(app as AppType)

    try {
      const response = await app.inject({
        method: 'GET',
        url: `/api/search?${qs.stringify({ filter: [durationFilter('>=', '3600')] })}`,
      })
      expect(response.statusCode).toBe(200)
      expect(response.json()).toEqual({ count: 0, data: [] })
      const where = { AND: [{ duration: { gte: 3600 } }] }
      expect(prisma.game.count).toHaveBeenCalledWith({ where })
      expect(prisma.game.findMany).toHaveBeenCalledWith(expect.objectContaining({ where }))
    } finally {
      await app.close()
    }
  })
})
