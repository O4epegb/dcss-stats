import prettyBytes from 'pretty-bytes'
import fse from 'fs-extra'
import dayjs from 'dayjs'
import util from 'util'
import { exec } from 'child_process'

const pExec = util.promisify(exec)

export const fetchLogfile = async (remoteUrl: string, localUrl: string) => {
  await fse.ensureFile(localUrl)

  const localSize = fse.statSync(localUrl).size
  const startTime = dayjs()

  console.log(`wget: starting ${remoteUrl}`)

  await pExec(
    `wget --no-check-certificate --tries=2 --quiet --timeout=90 --continue ${remoteUrl} -O ${localUrl}`,
  )

  const newSize = fse.statSync(localUrl).size

  console.log(
    `wget: finished in ${dayjs().diff(
      startTime,
      'seconds',
    )}s, ${remoteUrl} downloaded to ${localUrl}`,
  )

  if (localSize !== newSize) {
    console.log(
      `File updated: ${prettyBytes(localSize)} -> ${prettyBytes(newSize)}, diff ${prettyBytes(
        newSize - localSize,
      )}`,
    )
  } else {
    console.log(`File in sync: ${prettyBytes(localSize)}`)
  }
}
