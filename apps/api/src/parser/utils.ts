import fse from 'fs-extra'
import { keys, pickBy, without } from 'lodash-es'

const splitRegExp = /(?:[^:]|::)+/g
const keyValueRegExp = /(?:[^=])+/g

export const getVersionIntegerFromString = (versionShort: string) => {
  const [major, minor] = versionShort.split('.').map(Number)
  return (major || 0) * 1000 + (minor || 0)
}

export const getVersionStringFromInteger = (versionInteger: number) => {
  const major = Math.floor(versionInteger / 1000)
  const minor = versionInteger % 1000
  return `${major}.${minor}`
}

export const parseRawGameFromLine = (line: string) => {
  const matched = Array.from(line.trim().match(splitRegExp) ?? [])
  return matched.reduce(
    (acc, chunk) => {
      const [key, value] = chunk.match(keyValueRegExp) || []

      if (!key || !value) {
        return acc
      }

      acc[key] = value.replace('::', ':')
      return acc
    },
    {
      logLine: line,
    } as Record<string, string>,
  )
}

const requiredKeys = [
  'name',
  'ktyp',
  'start',
  'end',
  'v',
  'race',
  'cls',
  'char',
  'xl',
  'sc',
  'turn',
  'title',
  'tmsg',
  'dur',
  'br',
  'lvl',
  'str',
  'int',
  'dex',

  // added by local code
  'logLine',
] as const
const requiredKeysLength = requiredKeys.length

type RequiredKeysMap = {
  [key in (typeof requiredKeys)[number]]: string
}

const requiredKeysMap = requiredKeys.reduce((acc, key) => {
  acc[key] = key
  return acc
}, {} as RequiredKeysMap)

export type ParsedGame = RequiredKeysMap & {
  isValid: boolean
  god: string | null
  piety: string | null
  nrune: string
  urune: string
  fgem: string
  igem: string
  fifteenskills: string | null
  maxskills: string | null
  ac: string | null
  ev: string | null
  sh: string | null
  killer: string | null
  killerType: string | null
  scrollsused: string | null
  potionsused: string | null
  gold: string | null
  goldfound: string | null
  goldspent: string | null
  missing: string[]
}

export const getGameFromCandidate = (candidate: Record<string, string>): ParsedGame => {
  const picked = pickBy(
    candidate,
    // @ts-expect-error can't index by string
    (value, key) => value && requiredKeysMap[key],
  )
  const isValid = keys(picked).length === requiredKeysLength

  return Object.assign(picked as RequiredKeysMap, {
    isValid,
    god: candidate.god || null,
    piety: candidate.piety || null,
    nrune: candidate.nrune || candidate.urune || '0',
    urune: candidate.urune || candidate.nrune || '0',
    fgem: candidate.fgem || '0',
    igem: candidate.igem || '0',
    fifteenskills: candidate.fifteenskills || null,
    maxskills: candidate.maxskills || null,
    ac: candidate.ac || null,
    ev: candidate.ev || null,
    sh: candidate.sh || null,
    killer: candidate.killer || null,
    killerType: candidate.killer_flags === 'unique' ? candidate.killer_flags : null,
    scrollsused: candidate.scrollsused || null,
    potionsused: candidate.potionsused || null,
    gold: candidate.gold || null,
    goldfound: candidate.goldfound || null,
    goldspent: candidate.goldspent || null,
    missing: isValid ? [] : without(requiredKeys, ...keys(picked)),
  })
}

export function readLines(path: string, start: number, end: number) {
  return new Promise<{
    lines: string[]
    totalLength: number
    rest: number
  }>((resolve) => {
    const stream = fse.createReadStream(path, {
      start,
      end,
      encoding: 'utf-8',
    })

    const lines: string[] = []
    let remaining = ''
    let totalLength = 0

    stream.on('data', (data) => {
      remaining += data
      let index = remaining.indexOf('\n')
      let last = 0

      while (index > -1) {
        const line = remaining.substring(last, index)
        lines.push(line)

        // byteLength because line can has Unicode chars and be longer in terms of bytes
        // + 1 to account new line for string
        totalLength += Buffer.byteLength(line, 'utf-8') + 1

        last = index + 1

        index = remaining.indexOf('\n', last)
      }

      remaining = remaining.substring(last)
    })

    stream.on('end', () => {
      resolve({
        lines,
        totalLength,
        rest: remaining.length,
      })
    })
  })
}
