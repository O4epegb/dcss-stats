import dayjs from 'dayjs'
import { last, shuffle } from 'lodash-es'
import PQueue from 'p-queue'
import semver from 'semver'
import { prisma } from '~/prisma'
import { LogfileWithServer } from '~/types'
import { getLocalLogPath, getRemoteLogPath, isDefined, logger } from '~/utils'
import { fetchLogfile } from './fetchLogfile'

const oneMinuteInMs = 60 * 1000

export const getFetchTimeout = (
  latestVersion: semver.SemVer | undefined | null,
  fileVersion: semver.SemVer | null,
) => {
  if (
    fileVersion &&
    latestVersion &&
    [fileVersion, new semver.SemVer(fileVersion.version).inc('minor')].some((v) =>
      semver.eq(v, latestVersion),
    )
  ) {
    return oneMinuteInMs * 5
  }

  return oneMinuteInMs * 25
}

const fetchFile = async (file: LogfileWithServer, latestVersion: semver.SemVer | undefined) => {
  const timeoutMs = getFetchTimeout(latestVersion, semver.coerce(file.version))
  const shouldFetch = dayjs().diff(file.lastFetched, 'ms') >= timeoutMs

  logger(
    `loader: ${file.server.abbreviation}@${file.version} last fetch ${dayjs().diff(
      file.lastFetched,
      's',
    )}s ago, ${shouldFetch ? 'starting now' : 'skipping'} (timeout ${Math.trunc(
      timeoutMs / 1000,
    )}s)`,
  )

  if (shouldFetch) {
    return fetchLogfile(getRemoteLogPath(file), getLocalLogPath(file)).finally(async () => {
      await prisma.logfile.update({
        where: { id: file.id },
        data: { lastFetched: new Date() },
      })
    })
  }
}

export const startFetchQueue = async () => {
  const logfiles = await prisma.logfile.findMany()
  const totalFiles = logfiles.length

  const versions = semver.sort(logfiles.map((f) => semver.coerce(f.version)).filter(isDefined))
  const latestVersion = last(versions)

  const queue = new PQueue({
    concurrency: 1,
    timeout: 120000,
    throwOnTimeout: true,
    interval: Math.max(1, (oneMinuteInMs * 5) / totalFiles),
    intervalCap: 1,
  })

  const main = async () => {
    const logfiles = await prisma.logfile.findMany({
      where: { server: { isDormant: false } },
      include: { server: true },
    })

    for (const file of shuffle(logfiles)) {
      queue.add(() =>
        fetchFile(file, latestVersion).catch((err) => {
          if (err instanceof Error) {
            err.message = `loader: ${file.server.abbreviation}@${file.version}, ${err.message}`
            console.error(err.message)
          }

          throw err
        }),
      )
    }
  }

  main()

  queue.on('idle', () => {
    main()
  })
}
