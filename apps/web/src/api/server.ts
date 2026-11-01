import { rootUrl } from '~/constants'

export const fetchApi: typeof fetch = (url, params) => {
  const routeUrl = `${rootUrl}/api${url}`

  return params ? fetch(routeUrl, params) : fetch(routeUrl)
}
