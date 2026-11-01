import qs from 'qs'

export const serializeParams = (params: Record<string, unknown> | undefined) =>
  qs.stringify(params, { skipNulls: true })
