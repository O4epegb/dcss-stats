import { describe, expect, test, vi } from 'vitest'
import { getWhereQueryFromFilter } from '~/app/routes/search'

vi.mock('~/app/getters/getStaticData', () => ({
  getStaticData: async () => ({
    races: [],
    classes: [],
    gods: [],
    versions: [],
    servers: [],
  }),
}))

vi.mock('~/prisma', () => ({ prisma: {} }))

const killerFilter = (condition: string, value: string, operator = 'and') => ({
  option: 'Killer',
  condition,
  value,
  operator,
})

describe('killer search filter', () => {
  test.each([
    ['Death yak', 'Death yak'],
    ['a death yak', 'death yak'],
    ['an elephant', 'elephant'],
    [' AN elephant ', 'elephant'],
    ['Sigmund', 'Sigmund'],
    ['Aizul', 'Aizul'],
  ])('matches the exact bare and article-prefixed names for %s', async (input, name) => {
    expect(await getWhereQueryFromFilter([killerFilter('is', input)])).toEqual({
      AND: [{ killer: { in: [name, `a ${name}`, `an ${name}`], mode: 'insensitive' } }],
    })
  })

  test('excludes every article variant for is not', async () => {
    expect(await getWhereQueryFromFilter([killerFilter('is not', 'a death yak')])).toEqual({
      AND: [
        { killer: { notIn: ['death yak', 'a death yak', 'an death yak'], mode: 'insensitive' } },
      ],
    })
  })

  test('preserves OR grouping when combining killer names', async () => {
    const where = await getWhereQueryFromFilter([
      killerFilter('is', 'death yak', 'or'),
      killerFilter('is', 'Sigmund'),
    ])

    expect(where.AND).toContainEqual({
      OR: [
        { killer: { in: ['death yak', 'a death yak', 'an death yak'], mode: 'insensitive' } },
        { killer: { in: ['Sigmund', 'a Sigmund', 'an Sigmund'], mode: 'insensitive' } },
      ],
    })
  })
})
