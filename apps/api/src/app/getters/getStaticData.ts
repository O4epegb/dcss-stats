import { memoize, orderBy, uniq } from 'lodash-es'
import semver from 'semver'
import { draconians } from '~/app/constants'
import { prisma } from '~/prisma'

export const getStaticData = memoize(async () => {
  const [races, classes, gods, versions] = await Promise.all([
    prisma.race
      .findMany({
        orderBy: [{ trunk: 'desc' }, { name: 'asc' }],
      })
      .then((data) => {
        return data.flatMap((r) => {
          if (r.name !== 'Draconian') {
            return {
              ...r,
              isSubRace: false,
            }
          }

          return [
            {
              ...r,
              isSubRace: false,
            },
            ...draconians.map((name) => ({
              ...r,
              name,
              isSubRace: true,
            })),
          ]
        })
      }),
    prisma.class.findMany({
      orderBy: [{ trunk: 'desc' }, { name: 'asc' }],
    }),
    prisma.god.findMany().then((gods) => orderBy(gods, (god) => god.name.toLowerCase())),
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
