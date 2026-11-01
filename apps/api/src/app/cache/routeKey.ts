import qs from 'qs'

export function getRouteCacheKey(url: string, query: object): string {
  const pathname = url.split('?', 1)[0] ?? url
  const search = qs.stringify(query, { sort: (a, b) => a.localeCompare(b) })
  return search ? `${pathname}?${search}` : pathname
}
