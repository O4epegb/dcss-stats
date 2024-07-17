import path from 'path'
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
