import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import utcPlugin from 'dayjs/plugin/utc'
import { chunk, uniq } from 'lodash-es'
import { hasher as createHasher } from 'node-object-hash'
import { prisma } from '~/prisma'
import { LogfileWithServer } from '~/types'
import { ParsedGame, parseRawGameFromLine, getGameFromCandidate } from './utils'

const hasher = createHasher()

const versionRegExp = /\d+\.\d+/

dayjs.extend(customParseFormat)
dayjs.extend(utcPlugin)

export const processGames = async (file: LogfileWithServer, lines: string[]) => {
  const { invalidGames, validGames } = lines.reduce(
    (acc, line) => {
      const candidate = getGameFromCandidate(parseRawGameFromLine(line))

      const target = candidate.isValid ? acc.validGames : acc.invalidGames
      target.push(candidate)

      return acc
    },
    {
      invalidGames: [] as ParsedGame[],
      validGames: [] as ParsedGame[],
    },
  )

  if (invalidGames.length) {
    // TODO batch log invalid games
    await prisma.invalidGame.createMany({
      data: invalidGames.map((g) => ({
        // Null byte replacement hack
        logLine: g.logLine.replace(/\0/g, ''),
        logfileId: file.id,
        missing: g.missing.join(', '),
      })),
    })
  }

  await prisma.player.createMany({
    data: uniq(validGames.map((g) => g.name)).map((name) => ({ id: name.toLowerCase(), name })),
    skipDuplicates: true,
  })

  const gamesWithId = validGames.map((rawGame) => {
    const { name, start } = rawGame
    const id = hasher.hash({ name, serverName: file.server.name, start })

    return Object.assign(rawGame, {
      id,
    })
  })

  const chunks = chunk(gamesWithId, 5000)

  for (const chunk of chunks) {
    await prisma.game.deleteMany({
      where: { id: { in: chunk.map((x) => x.id) } },
    })
  }

  for (const chunk of chunks) {
    await prisma.game.createMany({
      skipDuplicates: true,
      data: chunk.map((rawGame) => {
        const raceAbbr = normalizeRaceAbbr(rawGame)
        const classAbbr = normalizeClassAbbr(rawGame)

        return {
          id: rawGame.id,
          isWin: rawGame.ktyp === 'winning',
          version: rawGame.v,
          versionShort: rawGame.v.match(versionRegExp)![0],
          race: rawGame.race,
          class: rawGame.cls,
          normalizedRace: normalizeRace(rawGame),
          normalizedClass: normalizeClass(rawGame),
          char: raceAbbr + classAbbr,
          raceAbbr,
          classAbbr,
          score: Number(rawGame.sc),
          xl: Number(rawGame.xl),
          god: rawGame.god,
          turns: Number(rawGame.turn),
          duration: Number(rawGame.dur),
          runes: Number(rawGame.nrune),
          uniqueRunes: Number(rawGame.urune),
          branch: rawGame.br,
          lvl: Number(rawGame.lvl),
          piety: rawGame.piety !== null ? parseInt(rawGame.piety, 10) : null,
          title: rawGame.title,
          endMessage: rawGame.tmsg,
          startAt: createDateFromLogfileDate(rawGame.start).toDate(),
          endAt: createDateFromLogfileDate(rawGame.end).toDate(),
          logfileId: file.id,
          playerId: rawGame.name.toLowerCase(),
          fifteenskills: rawGame.fifteenskills
            ? rawGame.fifteenskills.split(',').map((x) => x.toLowerCase())
            : [],
          maxskills: rawGame.maxskills
            ? rawGame.maxskills.split(',').map((x) => x.toLowerCase())
            : [],
          name: rawGame.name,
          str: Number(rawGame.str),
          int: Number(rawGame.int),
          dex: Number(rawGame.dex),
          ac: rawGame.ac !== null ? Number(rawGame.ac) : null,
          ev: rawGame.ev !== null ? Number(rawGame.ev) : null,
          sh: rawGame.sh !== null ? Number(rawGame.sh) : null,
          killer: rawGame.killer,
          scrollsused: rawGame.scrollsused !== null ? Number(rawGame.scrollsused) : null,
          potionsused: rawGame.potionsused !== null ? Number(rawGame.potionsused) : null,
          gold: rawGame.gold !== null ? Number(rawGame.gold) : null,
          goldfound: rawGame.goldfound !== null ? Number(rawGame.goldfound) : null,
          goldspent: rawGame.goldspent !== null ? Number(rawGame.goldspent) : null,
        }
      }),
    })
  }
}

const createDateFromLogfileDate = (string: string) => {
  const [, year, month, rest] = string.match(/(\d{4})(\d{2})(\d{8}).*/) || []

  return dayjs(`${year}${String(Number(month) + 1).padStart(2, '0')}${rest}`, 'YYYYMMDDHHmmss').utc(
    true,
  )
}

// TODO Add originalRace field and replace race with normalizedRace, same for class

export const classMap: Record<string, string> = {
  'Arcane Marksman': 'Hexslinger',
  Assassin: 'Brigand',
  Wizard: 'Hedge Wizard',
}

const normalizeClass = (rawGame: ParsedGame) => {
  return classMap[rawGame.cls] ?? rawGame.cls
}

export const raceMap: Record<string, string> = {
  Grotesk: 'Gargoyle',
  Kenku: 'Tengu',
  Bultungin: 'Gnoll',
  Barachian: 'Barachi',
  Yak: 'Elf',
}

const normalizeRace = (rawGame: ParsedGame) => {
  return rawGame.race.indexOf('Draconian') > 0
    ? 'Draconian'
    : (raceMap[rawGame.race] ?? rawGame.race)
}

export const raceAbbrMap: Record<string, string> = {
  DS: 'Ds',
  DG: 'Dg',
  OP: 'Op',
  Bu: 'Gn',
  Ke: 'Te',
}

const normalizeRaceAbbr = (rawGame: ParsedGame) => {
  if (rawGame.race === 'Gnome') {
    return 'Gm'
  }

  const abbr = rawGame.char.slice(0, 2)

  return raceAbbrMap[abbr] || abbr
}

export const classAbbrMap: Record<string, string> = {
  Am: 'Hs',
  As: 'Br',
  AM: 'Hs',
  Wz: 'HW',
}

const normalizeClassAbbr = (rawGame: ParsedGame) => {
  const abbr = rawGame.char.slice(2, 4)

  return classAbbrMap[abbr] || abbr
}
