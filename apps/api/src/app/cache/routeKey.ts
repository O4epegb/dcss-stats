import qs from 'qs'

export function getRouteCacheKey(url: string, query: object): string {
  const pathname = url.split('?', 1)[0] ?? url
  const parameters = Object.fromEntries(
    Object.entries(query).filter(([key]) => key !== 'noCache' && key !== 'clearData'),
  )
  const search = qs.stringify(parameters, { sort: (a, b) => a.localeCompare(b) })
  return search ? `${pathname}?${search}` : pathname
}
