import fse from 'fs-extra'
import PQueue from 'p-queue'
import prettyBytes from 'pretty-bytes'
import { prisma } from '~/prisma'
import { LogfileWithServer } from '~/types'
import { delay, getLocalLogPath, logger } from '~/utils'
import { processGames } from './processGames'
import { readLines } from './utils'

const bytesToRead = 10 * 1024 * 1024

const queue = new PQueue({
  concurrency: 1,
  timeout: 150000,
  throwOnTimeout: true,
  interval: 1000,
  intervalCap: 1,
})

const parseFile = async (file: LogfileWithServer) => {
  const localPath = getLocalLogPath(file)

  if (!fse.existsSync(localPath)) {
    return
  }

  const localSize = fse.statSync(localPath).size
  const shouldRead = file.bytesRead < localSize

  logger(
    `reader: ${file.server.abbreviation}:${file.path}, bytesRead: ${prettyBytes(
      file.bytesRead,
    )}, localSize: ${prettyBytes(localSize)}, shouldRead: ${shouldRead}`,
  )

  if (!shouldRead) {
    return
  }

  const end = Math.min(file.bytesRead + bytesToRead, localSize - 1)

  logger(
    `reader: ${file.server.abbreviation}:${file.path}, reading ${prettyBytes(
      file.bytesRead,
    )}-${prettyBytes(end)} of ${prettyBytes(localSize)}`,
  )

  const linesResponse = await readLines(localPath, file.bytesRead, end)

  logger(
    `reader: ${file.server.abbreviation}:${file.path}, new lines: ${linesResponse.lines.length}, extra text: ${linesResponse.rest}`,
  )

  try {
    await processGames(file, linesResponse.lines)
  } catch (err) {
    if (err instanceof Error) {
      err.message = `reader: ${file.server.abbreviation}:${file.path}, ${err.message}`
      console.error(err.message)
    }

    throw err
  }

  await prisma.logfile.update({
    where: { id: file.id },
    data: { bytesRead: file.bytesRead + linesResponse.totalLength },
  })

  logger(
    `reader: ${file.server.abbreviation}:${file.path}, successfully processed ${linesResponse.lines.length} lines`,
  )

  await delay(1000)
}

const main = async () => {
  const logfiles = await prisma.logfile.findMany({ include: { server: true } })

  for (const file of logfiles) {
    queue.add(() =>
      parseFile(file).catch((err) => {
        if (err instanceof Error) {
          err.message = `reader: ${file.server.abbreviation}:${file.path}, ${err.message}`
          console.error(err.message)
        }

        throw err
      }),
    )
  }
}

export const startParseQueue = () => {
  main()

  queue.on('idle', () => {
    main()
  })
}
