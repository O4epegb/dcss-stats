import { memoize, uniq } from 'lodash-es'
import semver from 'semver'
import { prisma } from '~/prisma'

export const getStaticData = memoize(async () => {
  const [races, classes, gods, versions] = await Promise.all([
    prisma.race.findMany(),
    prisma.class.findMany(),
    prisma.god.findMany(),
    prisma.logfile.findMany().then((logfiles) => {
      const versions = logfiles
        .map((logfile) => logfile.version)
        .filter((version) => !isNaN(parseFloat(version)))
        .sort((a, b) => b.localeCompare(a, undefined, { numeric: true }))

      const { major, minor } = semver.coerce(versions[0], { loose: true })?.inc('minor') ?? {}
      const additional = major !== undefined && minor !== undefined ? [`${major}.${minor}`] : []

      return uniq(additional.concat(versions))
    }),
  ])

  return { races, classes, gods, versions }
})
