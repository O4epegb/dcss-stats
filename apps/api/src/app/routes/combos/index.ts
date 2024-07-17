import { AppType } from '~/app/app'
import { skills } from '~/app/constants'
import { getStaticData } from '~/app/getters'

export const combosRoute = (app: AppType) => {
  app.get('/api/combos', async () => {
    const [races, classes, gods, versions] = await getStaticData()

    return { races, classes, gods, versions, skills }
  })
}
