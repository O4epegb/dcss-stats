import path from 'path'
import Bugsnag from '@bugsnag/js'
import { LogfileWithServer } from './types'

export const getRemoteLogPath = (file: LogfileWithServer) => {
  return file.path.startsWith('http') ? file.path : file.server.baseUrl + file.path
}

export const getLocalLogPath = (file: LogfileWithServer) => {
  return path.resolve(
    process.cwd(),
    'logfiles',
    file.server.abbreviation,
    `${file.server.abbreviation}-${file.version}`,
  )
}

export const delay = (ms: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms)
  })

export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined
}

export const trackError = (error: Error) => {
  if (process.env.NODE_ENV === 'production') {
    Bugsnag.notify(error)
  }
}

export const logger = (message: string) => {
  // eslint-disable-next-line no-console
  console.log(message)
}
