import semver from 'semver'
import { Type } from 'typebox'
import { AppType } from '~/app/app'
import { getStaticData } from '~/app/getters/getStaticData'
import { filterQuerystringPart, getWhereQueryFromFilter } from '~/app/routes/search'
import { validateQuery } from '~/app/utils/validateQuery'
import { Prisma } from '~/generated/prisma/client/client'
import { getVersionIntegerFromString } from '~/parser/utils'
import { prisma } from '~/prisma'
import { isDefined } from '~/utils'

const createQuery = (data?: Awaited<ReturnType<typeof getStaticData>>) =>
  Type.Object({
    noCache: Type.Optional(Type.Boolean()),
    datasets: Type.Optional(
      Type.Array(
        Type.Object({
          filters: filterQuerystringPart,
        }),
        {
          maxItems: 5,
        },
      ),
    ),
    groupBy: Type.String(),
    aggregationType: Type.String(),
    aggregationField: Type.String(),
    version: data ? Type.Enum(data.versions) : Type.String(),
  })

export const chartRoute = (app: AppType) => {
  app.get(
    '/api/charts',
    {
      schema: { querystring: createQuery() },
      preHandler: validateQuery(getStaticData, createQuery),
    },
    async (request) => {
      const { version, datasets, groupBy, aggregationField, aggregationType } = request.query

      const data = await Promise.all(
        (
          datasets ?? [
            {
              filters: [],
            },
          ]
        ).map(async (dataset) => {
          if (!dataset.filters) {
            return null
          }

          const where = await getWhereQueryFromFilter(dataset.filters)
          const aggregation = {
            [`_${aggregationType}`]: {
              [aggregationField]: true,
            },
          }

          return prisma.game.groupBy({
            by: [groupBy as Prisma.GameScalarFieldEnum],
            where: {
              ...where,
              versionShort: undefined,
              versionInteger:
                groupBy === 'versionShort' ? undefined : getVersionIntegerFromString(version),
            },
            ...aggregation,
          })
        }),
      )

      return {
        data: data.filter(isDefined).map((set) => {
          if (groupBy === 'versionShort') {
            return set.sort((a, b) => {
              return semver.compare(
                semver.coerce(a.versionShort) ?? a.versionShort,
                semver.coerce(b.versionShort) ?? b.versionShort,
              )
            })
          } else {
            return set
          }
        }),
      }
    },
  )
}
