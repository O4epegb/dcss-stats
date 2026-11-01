import { Type } from 'typebox'
import { AppType } from '~/app/app'
import { skills } from '~/app/constants'
import { getStaticData } from '~/app/getters/getStaticData'
import { getFilterOptions } from '~/app/routes/search'
import { ApiError } from '~/app/schemas/api-error'
import { schemaRef } from '~/app/schemas/ref'

const StaticData = Type.Object(
  {
    races: Type.Array(
      Type.Object({
        name: Type.String(),
        abbr: Type.String(),
        trunk: Type.Boolean(),
        isSubRace: Type.Boolean(),
      }),
    ),
    classes: Type.Array(
      Type.Object({ name: Type.String(), abbr: Type.String(), trunk: Type.Boolean() }),
    ),
    gods: Type.Array(Type.Object({ name: Type.String(), trunk: Type.Boolean() })),
    versions: Type.Array(Type.String()),
    skills: Type.Array(Type.Object({ name: Type.String(), trunk: Type.Boolean() })),
    servers: Type.Array(
      Type.Object({
        abbreviation: Type.String(),
        url: Type.String(),
        ttyrecUrl: Type.Union([Type.String(), Type.Null()]),
      }),
    ),
    filterOptions: Type.Array(
      Type.Object({
        name: Type.String(),
        type: Type.String(),
        suboptions: Type.Array(Type.String()),
        conditions: Type.Array(Type.String()),
        placeholder: Type.String(),
        values: Type.Array(Type.String()),
      }),
    ),
  },
  { $id: 'StaticData' },
)

export const staticDataRoute = (app: AppType) => {
  app.addSchema(StaticData)

  app.get(
    '/api/static-data',
    {
      schema: {
        operationId: 'getStaticData',
        response: { 200: schemaRef(StaticData), 500: schemaRef(ApiError) },
      },
    },
    async () => {
      const { races, classes, gods, versions, servers } = await getStaticData()
      const filterOptions = await getFilterOptions()

      return {
        races,
        classes,
        gods,
        versions,
        skills,
        servers,
        filterOptions: filterOptions.map((option) => {
          return {
            name: option.queryName,
            type: option.type,
            suboptions: 'suboptions' in option ? option.suboptions : [],
            conditions: option.conditions.map((condition) => condition.inQuery),
            placeholder: 'placeholder' in option ? option.placeholder : '',
            values: 'values' in option ? [...option.values] : [],
          }
        }),
      }
    },
  )
}
