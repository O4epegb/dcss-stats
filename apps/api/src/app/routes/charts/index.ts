import semver from 'semver'
import { Type } from 'typebox'
import { AppType } from '~/app/app'
import { createCache, getRouteCacheKey, type CacheManager } from '~/app/cache'
import { getStaticData } from '~/app/getters/getStaticData'
import { filterQuerystringPart, getWhereQueryFromFilter } from '~/app/routes/search'
import { validateQuery } from '~/app/utils/validateQuery'
import { Prisma } from '~/generated/prisma/client/client'
import { getVersionIntegerFromString } from '~/parser/utils'
import { prisma } from '~/prisma'
import { isDefined } from '~/utils'

const createQuery = (data?: Awaited<ReturnType<typeof getStaticData>>) =>
  Type.Object({
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

export const chartRoute = (
  app: AppType,
  {
    cache = createCache({ revalidate: 300, expire: 900, maxEntries: 64 }),
  }: { cache?: CacheManager } = {},
) => {
  app.get(
    '/api/charts',
    {
      schema: { querystring: createQuery() },
      preHandler: validateQuery(getStaticData, createQuery),
    },
    async (request) => {
      const {
        version,
        datasets = [{ filters: [] }],
        groupBy,
        aggregationField,
        aggregationType,
      } = request.query

      return cache.get({
        key: getRouteCacheKey('/api/charts', {
          version,
          // qs drops empty arrays, but [] and [{ filters: [] }] produce different results.
          datasets: JSON.stringify(datasets),
          groupBy,
          aggregationField,
          aggregationType,
        }),
        loader: async () => {
          const data = await Promise.all(
            datasets.map(async (dataset) => {
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
      })
    },
  )
}
