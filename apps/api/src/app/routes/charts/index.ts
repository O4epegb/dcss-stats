import { Prisma } from '@prisma/client'
import { Static, Type } from '@sinclair/typebox'
import semver from 'semver'
import { AppType } from '~/app/app'
import { getStaticData } from '~/app/getters/getStaticData'
import { filterQuerystringPart, getWhereQueryFromFilter } from '~/app/routes/search'
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
          // minItems: 1,
          maxItems: 5,
        },
      ),
    ),
    groupBy: Type.String(),
    aggregationType: Type.String(),
    aggregationField: Type.String(),
    version: Type.Union(versions.map((version) => Type.Literal(version))),
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
              versionShort: groupBy === 'versionShort' ? undefined : version,
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
