import { isEmpty } from 'lodash-es'
import { Prisma } from '@prisma/client'
import { Static, Type } from '@sinclair/typebox'
import { AppType } from '~/app/app'
import { LIMIT } from '~/app/constants'
import { findGames } from '~/app/getters'
import { isDefined } from '~/utils'
import { UnpackedArray } from '~/types'
import { prisma } from '~/prisma'

export const filterQuerystringPart = Type.Optional(
  Type.Array(
    Type.Union([
      // Type.Object({
      //   option: Type.Literal('Win'),
      //   condition: Type.String(),
      //   value: Type.Boolean(),
      // }),
      Type.Object({
        option: Type.String(),
        suboption: Type.Optional(Type.String()),
        condition: Type.String(),
        value: Type.String(),
        operator: Type.String(),
      }),
    ]),
    { maxItems: 15 },
  ),
)

export const searchRoute = (app: AppType) => {
  const SearchQuerystring = Type.Object({
    after: Type.Optional(Type.String()),
    orderBy: Type.Optional(Type.Union([Type.Literal('startAt'), Type.Literal('endAt')])),
    filter: filterQuerystringPart,
  })

  app.get<{
    Querystring: Static<typeof SearchQuerystring>
  }>(
    '/api/search',
    {
      schema: {
        querystring: SearchQuerystring,
      },
    },
    async (request) => {
      const { filter = [], after, orderBy = 'endAt' } = request.query

      const where = getWhereQueryFromFilter(filter)

      const [count, data] = await Promise.all([
        after
          ? 0
          : isEmpty(where.AND)
            ? prisma.$queryRaw<
                { estimate: number }[]
              >`SELECT reltuples AS estimate FROM pg_class WHERE relname = 'Game';`
            : prisma.game.count({ where }),
        findGames({
          where,
          take: LIMIT,
          skip: after ? 1 : undefined,
          cursor: after ? { id: after } : undefined,
          orderBy: [{ [orderBy]: 'desc' }, { id: 'desc' }],
        }),
      ])

      return {
        count: typeof count === 'number' ? count : (count?.[0]?.estimate ?? 0),
        data,
      }
    },
  )
}

const conditionMap = {
  is: {
    inQuery: 'is',
    toSql: 'equals',
  },
  isNot: {
    inQuery: 'is not',
    toSql: 'not',
  },
  equals: {
    inQuery: '=',
    toSql: 'equals',
  },
  lt: {
    inQuery: '<',
    toSql: 'lt',
  },
  gt: {
    inQuery: '>',
    toSql: 'gt',
  },
  lte: {
    inQuery: '<=',
    toSql: 'lte',
  },
  gte: {
    inQuery: '>=',
    toSql: 'gte',
  },
} as const
type Condition = (typeof conditionMap)[keyof typeof conditionMap]
const defaultConditions: Condition[] = [conditionMap.is, conditionMap.isNot]
const numberConditions: Condition[] = [
  conditionMap.equals,
  conditionMap.lt,
  conditionMap.gt,
  conditionMap.lte,
  conditionMap.gte,
]
const operators: Record<string, string> = {
  and: 'AND',
  or: 'OR',
}

const options = [
  {
    field: 'normalizedRace',
    queryName: 'Race',
    conditions: defaultConditions,
    transformValue: (value: string) => value,
  },
  {
    field: 'normalizedClass',
    queryName: 'Class',
    conditions: defaultConditions,
    transformValue: (value: string) => value,
  },
  {
    field: 'god',
    queryName: 'God',
    conditions: defaultConditions,
    transformValue: (value: string) => value,
  },
  {
    field: 'isWin',
    queryName: 'End',
    conditions: defaultConditions,
    transformValue: (value: string) => {
      return {
        Escaped: true,
        Defeated: false,
      }[value]
    },
  },
  {
    field: 'playerId',
    queryName: 'Player',
    conditions: defaultConditions,
    transformValue: (value: string) => value.toLowerCase(),
  },
  {
    field: 'versionShort',
    queryName: 'Version',
    conditions: defaultConditions,
    transformValue: (value: string) => value,
  },
  {
    queryName: 'Skill',
    conditions: defaultConditions,
    getValue: (item: FilterItem, condition: (typeof defaultConditions)[number]) => {
      const values: Record<string, string> = {
        'Level 15 or more': 'fifteenskills',
        'Level 27': 'maxskills',
      }
      const skillName = (item.suboption ?? '').toLowerCase()

      const value = {
        [values[item.value]]: {
          has: skillName,
        },
      }

      return condition.inQuery === 'is not'
        ? {
            NOT: value,
          }
        : value
    },
  },
  {
    queryName: 'Stat',
    conditions: numberConditions,
    suboptions: ['Str', 'Int', 'Dex', 'Ac', 'Ev', 'Sh'] as string[],
    getValue: (item: FilterItem, condition: (typeof numberConditions)[number]) => {
      const statName = (item.suboption ?? '').toLowerCase()

      return {
        [statName]: {
          [condition.toSql]: Number(item.value),
        },
      }
    },
  },
  {
    field: 'uniqueRunes',
    queryName: 'Runes',
    conditions: numberConditions,
    transformValue: (value: string) => Number(value),
  },
] as const

type Filter = Static<typeof filterQuerystringPart>
type FilterItem = UnpackedArray<Filter>

export const getWhereQueryFromFilter = (filter: Filter) => {
  const isValid = filter.every((filter) => {
    const option = options.find((x) => x.queryName === filter.option)
    const condition = option?.conditions.some((x) => x.inQuery === filter.condition)
    const operator = operators[filter.operator]
    let suboption = true

    if (option && 'suboptions' in option) {
      suboption = Boolean(filter.suboption && option.suboptions.includes(filter.suboption))
    }

    return condition && operator && suboption
  })

  if (!isValid) {
    throw new Error('Invalid filter')
  }

  const normalized = filter
    .map((item) => {
      const option = options.find((x) => x.queryName === item.option)
      const condition = option?.conditions.find((x) => x.inQuery === item.condition)

      if (!option || !condition) {
        return undefined
      }

      if ('getValue' in option) {
        return {
          operator: item.operator,
          value: option.getValue(item, condition),
        }
      }

      return {
        operator: item.operator,
        value: {
          [option.field]: {
            [condition.toSql]: option.transformValue(item.value),
          },
        },
      }
    })
    .filter(isDefined)

  const main: Prisma.GameWhereInput['AND'] = []
  const where: Prisma.GameWhereInput = {
    AND: main,
  }
  let curr: Array<Prisma.GameWhereInput> = []

  normalized.forEach((item, index) => {
    const prev = normalized[index - 1]
    const next = normalized[index + 1]

    if (item.operator === 'or' || (prev && prev.operator === 'or')) {
      if (!prev || prev.operator === 'and') {
        curr = []
      }

      curr.push(item.value)

      if (!next || next.operator !== 'or') {
        main.push({
          OR: curr,
        })
      }
    } else {
      main.push(item.value)
    }
  })

  return where
}
