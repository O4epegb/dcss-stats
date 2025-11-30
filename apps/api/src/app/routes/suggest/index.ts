import { AppType } from '~/app/app'
import { suggestExperimentalRoute } from './experimental'

export const suggestRoute = (app: AppType) => {
  suggestExperimentalRoute(app)
}
