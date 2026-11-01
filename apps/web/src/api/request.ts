import type { AxiosRequestConfig } from 'axios'
import { api } from '~/api'
import { rootUrl } from '~/constants'

export const apiRequest = <T>(
  config: AxiosRequestConfig,
  options?: AxiosRequestConfig,
): Promise<T> => api<T>({ ...config, baseURL: rootUrl, ...options }).then(({ data }) => data)
