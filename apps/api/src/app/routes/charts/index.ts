import semver from 'semver'
import { Static, Type } from 'typebox'
import { AppType } from '~/app/app'
import { getStaticData } from '~/app/getters/getStaticData'
import { filterQuerystringPart, getWhereQueryFromFilter } from '~/app/routes/search'
import { Prisma } from '~/generated/prisma/client/client'
import { getVersionIntegerFromString } from '~/parser/utils'
import { prisma } from '~/prisma'
import { isDefined } from '~/utils'

export const chartRoute = async (app: AppType) => {
  const { versions } = await getStaticData()

  const Query = Type.Object({
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
    version: Type.Enum(versions),
  })
  type QueryType = Static<typeof Query>

  app.get<{ Querystring: QueryType }>(
    '/api/charts',
    { schema: { querystring: Query } },
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

          return prisma.game.groupBy({
            by: [groupBy as Prisma.GameScalarFieldEnum],
            where: {
              ...where,
              versionShort: undefined,
              versionInteger:
                groupBy === 'versionShort' ? undefined : getVersionIntegerFromString(version),
            },
            ...{
              [`_${aggregationType}`]: {
                [aggregationField]: true,
              },
            },
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
