import { execFile } from 'child_process'
import util from 'util'
import dayjs from 'dayjs'
import fse from 'fs-extra'
import prettyBytes from 'pretty-bytes'
import { logger } from '~/utils'

const pExecFile = util.promisify(execFile)

export const fetchLogfile = async (remoteUrl: string, localUrl: string) => {
  await fse.ensureFile(localUrl)

  const localSize = fse.statSync(localUrl).size
  const startTime = dayjs()

  logger(`wget: starting ${remoteUrl}`)

  await pExecFile(`wget`, [
    '--no-check-certificate',
    '--tries=2',
    '--quiet',
    '--timeout=90',
    '--continue',
    remoteUrl,
    '-O',
    localUrl,
  ])

  const newSize = fse.statSync(localUrl).size

  logger(
    `wget: finished in ${dayjs().diff(
      startTime,
      'seconds',
    )}s, ${remoteUrl} downloaded to ${localUrl}`,
  )

  if (localSize !== newSize) {
    logger(
      `File updated: ${prettyBytes(localSize)} -> ${prettyBytes(newSize)}, diff ${prettyBytes(
        newSize - localSize,
      )}`,
    )
  } else {
    logger(`File in sync: ${prettyBytes(localSize)}`)
  }
}
