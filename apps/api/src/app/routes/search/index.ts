import { Prisma } from '@prisma/client'
import { Static, Type } from '@sinclair/typebox'
import { isEmpty } from 'lodash-es'
import { AppType } from '~/app/app'
import { skills } from '~/app/constants'
import { findGamesIncludeServer } from '~/app/getters/findGamesIncludeServer'
import { getStaticData } from '~/app/getters/getStaticData'
import { prisma } from '~/prisma'
import { UnpackedArray } from '~/types'
import { isDefined } from '~/utils'

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

type Filter = Static<typeof filterQuerystringPart>
type FilterItem = UnpackedArray<Filter>

export const searchRoute = (app: AppType) => {
  const SearchQuerystring = Type.Object({
    after: Type.Optional(Type.String()),
    orderBy: Type.Optional(Type.Union([Type.Literal('startAt'), Type.Literal('endAt')])),
    filter: filterQuerystringPart,
  })

  app.get(
    '/api/search',
    {
      schema: {
        querystring: SearchQuerystring,
      },
    },
    async (request) => {
      const { filter = [], after, orderBy = 'endAt' } = request.query

      const where = await getWhereQueryFromFilter(filter)

      const [count, data] = await Promise.all([
        after
          ? 0
          : isEmpty(where.AND)
            ? prisma.$queryRaw<
                { estimate: number }[]
              >`SELECT reltuples AS estimate FROM pg_class WHERE relname = 'Game';`
            : prisma.game.count({ where }),
        findGamesIncludeServer({
          where,
          take: 10,
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
  conditionMap.gte,
  conditionMap.lte,
  conditionMap.gt,
  conditionMap.lt,
  conditionMap.equals,
]
const operators: Record<string, string> = {
  and: 'AND',
  or: 'OR',
}

export const getFilterOptions = async () => {
  const { races, classes, gods, versions } = await getStaticData()

  const options = [
    {
      type: 'select',
      dbField: 'normalizedRace',
      queryName: 'Race',
      conditions: defaultConditions,
      values: races.map((r) => r.name),
      transformValue: (value: string) => value,
      getValue: (item: FilterItem, condition: (typeof defaultConditions)[number]) => {
        const isSubRace = races.some((r) => r.name === item.value && r.isSubRace)
        return {
          [isSubRace ? 'race' : 'normalizedRace']: {
            [condition.toSql]: item.value,
          },
        }
      },
    },
    {
      type: 'select',
      dbField: 'normalizedClass',
      queryName: 'Class',
      conditions: defaultConditions,
      values: classes.map((c) => c.name),
      transformValue: (value: string) => value,
    },
    {
      type: 'select',
      dbField: 'god',
      queryName: 'God',
      conditions: defaultConditions,
      values: gods.map((g) => g.name),
      transformValue: (value: string) => value,
    },
    {
      type: 'select',
      dbField: 'isWin',
      queryName: 'End',
      conditions: defaultConditions,
      values: ['Escaped', 'Defeated'],
      transformValue: (value: string) => {
        return {
          Escaped: true,
          Defeated: false,
        }[value]
      },
    },
    {
      type: 'text',
      dbField: 'playerId',
      queryName: 'Player',
      conditions: defaultConditions,
      placeholder: 'Enter player name',
      transformValue: (value: string) => value.toLowerCase(),
    },
    {
      type: 'text',
      dbField: 'title',
      queryName: 'Title',
      conditions: defaultConditions,
      placeholder: 'Enter title',
      transformValue: (value: string) => value,
    },
    {
      type: 'select',
      queryName: 'Skill',
      suboptions: skills.map((s) => s.name),
      conditions: defaultConditions,
      values: ['Level 15 or more', 'Level 27'],
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
      type: 'number',
      queryName: 'Stat',
      conditions: numberConditions,
      suboptions: ['Str', 'Int', 'Dex', 'Ac', 'Ev', 'Sh'] as string[],
      placeholder: 'Enter number',
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
      type: 'number',
      dbField: 'uniqueRunes',
      queryName: 'Runes',
      conditions: numberConditions,
      placeholder: 'Enter number',
      transformValue: (value: string) => Number(value),
    },
    {
      type: 'number',
      dbField: 'gems',
      queryName: 'Gems',
      conditions: numberConditions,
      placeholder: 'Enter number',
      transformValue: (value: string) => Number(value),
    },
    {
      type: 'number',
      dbField: 'turns',
      queryName: 'Turns',
      conditions: numberConditions,
      placeholder: 'Enter number',
      transformValue: (value: string) => Number(value),
    },
    {
      type: 'number',
      dbField: 'xl',
      queryName: 'XL',
      conditions: numberConditions,
      placeholder: 'Enter number',
      transformValue: (value: string) => Number(value),
    },
    {
      type: 'select',
      dbField: 'versionShort',
      queryName: 'Version',
      conditions: defaultConditions,
      values: versions,
      transformValue: (value: string) => value,
    },
  ] as const

  return options
}

export const getWhereQueryFromFilter = async (filter: Filter) => {
  const options = await getFilterOptions()

  const isValid = filter.every((filter) => {
    const option = options.find((x) => x.queryName === filter.option)
    const condition = option?.conditions.some((x) => x.inQuery === filter.condition)
    const operator = operators[filter.operator]
    let suboption = true

    if (option && 'suboptions' in option && option.suboptions.length > 0) {
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
          [option.dbField]: {
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
