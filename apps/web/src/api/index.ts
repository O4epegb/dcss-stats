import axios from 'axios'
import { rootUrl } from '~/constants'
import { serializeParams } from './query'

export const api = axios.create({
  baseURL: `${rootUrl}/api`,
  withCredentials: true,
  paramsSerializer: serializeParams,
})
