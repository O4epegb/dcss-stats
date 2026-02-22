import { AppType } from '~/app/app'
import { skills } from '~/app/constants'
import { getStaticData } from '~/app/getters/getStaticData'
import { getFilterOptions } from '~/app/routes/search'

export const staticDataRoute = (app: AppType) => {
  app.get('/api/static-data', async () => {
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
          values: 'values' in option ? option.values : [],
        }
      }),
    }
  })
}
