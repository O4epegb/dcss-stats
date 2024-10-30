import { PromiseReturnType } from '@prisma/client/extension'
import { Static, Type } from '@sinclair/typebox'
import fse from 'fs-extra'
import { groupBy, last, orderBy } from 'lodash-es'
import PQueue from 'p-queue'
import { AppType } from '~/app/app'
import { getStaticData } from '~/app/getters/getStaticData'
import { filterQuerystringPart, getWhereQueryFromFilter } from '~/app/routes/search'
import {
  fetchMorgueFile,
  getLocalMorguePath,
  getRemoteMorguePath,
} from '~/parser/morgue/fetchMorgue'
import { prisma } from '~/prisma'
import { GameWithLogfileAndServer } from '~/types'

const queue = new PQueue({
  concurrency: 1,
  timeout: 150000,
  throwOnTimeout: true,
  interval: 1000,
  intervalCap: 1,
})

const currentFetches = new Map<string, Promise<unknown>>()

export const suggestExperimentalRoute = (app: AppType) => {
  const Query = Type.Object({
    race: Type.Optional(Type.String()),
    class: Type.Optional(Type.String()),
    god: Type.Optional(Type.String()),
    version: Type.Optional(Type.String()),
    noCache: Type.Optional(Type.Boolean()),
    filter: filterQuerystringPart,
  })
  type QueryType = Static<typeof Query>

  app.get<{ Querystring: QueryType }>(
    '/api/suggest/experimental',
    { schema: { querystring: Query } },
    async (request, reply) => {
      const {
        race: raceNameOrAbbr,
        class: classNameOrAbbr,
        god: godName,
        version,
        filter = [],
      } = request.query

      const { races, classes, gods, versions } = await getStaticData()

      const race = races.find((r) => r.abbr === raceNameOrAbbr || r.name === raceNameOrAbbr)
      const cls = classes.find((c) => c.abbr === classNameOrAbbr || c.name === classNameOrAbbr)
      const god = gods.find((g) => g.name === godName)
      const versionShort = version ?? versions[0]

      if (!race && !cls && !god) {
        return reply.status(422).send('Race, class or god should be present')
      }

      if (process.env.NODE_ENV !== 'development' && versionShort !== versions[0]) {
        return reply.status(422).send('Only the latest version is supported for now')
      }

      const where = await getWhereQueryFromFilter(filter)
      const [games] = await Promise.all([
        prisma.game.findMany({
          where: {
            ...where,
            isWin: true,
            normalizedRace: race && !race.isSubRace ? race.name : undefined,
            race: race && race.isSubRace ? race.name : undefined,
            normalizedClass: cls?.name,
            god: god?.name,
            versionShort,
            logfile: {
              server: {
                isDormant: false,
                abbreviation: {
                  // sends gzip files instead of text, even if text is requested
                  not: 'CKO',
                },
              },
            },
          },
          take: 100,
          include: {
            logfile: {
              include: { server: true },
            },
          },
        }),
      ])

      const data: {
        morgueUrl: string
        skills: PromiseReturnType<typeof parseSkills>
      }[] = []

      const gamesWithNoMorgueFetched: typeof games = []
      const gamesWithMorgues: typeof games = []

      for (const game of games) {
        const localPath = getLocalMorguePath(game)
        const isMorgueFileExists = await fse.pathExists(localPath)

        if (isMorgueFileExists) {
          gamesWithMorgues.push(game)
        } else {
          gamesWithNoMorgueFetched.push(game)
        }
      }

      const gamesToUse = gamesWithMorgues.concat(gamesWithNoMorgueFetched.slice(0, 50))

      const gamesByServer = groupBy(
        gamesWithNoMorgueFetched,
        (game) => game.logfile.server.abbreviation,
      )

      const gameChunks: GameWithLogfileAndServer[][] = []
      while (true) {
        const chunk: GameWithLogfileAndServer[] = []
        let hasGames = false

        for (const server in gamesByServer) {
          const game = gamesByServer[server].pop()

          if (game) {
            hasGames = true
            chunk.push(game)
          }
        }

        if (!hasGames) {
          break
        }

        gameChunks.push(chunk)
      }

      for (const chunk of gameChunks) {
        await queue.add(() => {
          return Promise.all(
            chunk.map(async (game) => {
              const localPath = getLocalMorguePath(game)
              const remotePath = getRemoteMorguePath(game)

              if (!currentFetches.has(localPath)) {
                currentFetches.set(
                  localPath,
                  fetchMorgueFile(remotePath, localPath).finally(() => {
                    currentFetches.delete(localPath)
                  }),
                )
              }

              await currentFetches.get(localPath)
            }),
          )
        })
      }

      for (const game of gamesToUse) {
        const localPath = getLocalMorguePath(game)
        const remotePath = getRemoteMorguePath(game)

        const gameData = {
          morgueUrl: remotePath,
          skills: await parseSkills(localPath),
        }

        if (Object.keys(gameData.skills).length > 0) {
          data.push(gameData)
        }
      }

      const dataBySkill = groupBy(
        data.flatMap((item) =>
          Object.keys(item.skills).map((skillName) => ({
            skillName,
            data: item.skills[skillName],
          })),
        ),
        (item) => item.skillName,
      )

      const averages = Object.keys(dataBySkill).reduce(
        (acc, skillName) => {
          const skillData = orderBy(
            dataBySkill[skillName].map((item) => item.data),
            (x) => x.length,
            'desc',
          )

          const dataPoints = skillData[0].map((_, i) => {
            const howManySkillsHaveDataOnThisLevel = skillData.filter(
              (x) => x[i] !== undefined && x[i] !== 0,
            ).length

            return howManySkillsHaveDataOnThisLevel
          })

          acc[skillName] = {
            dataPoints,
            values: skillData[0].map((_, i) => {
              if (dataPoints[i] === 0) {
                return 0
              }

              const averageValue =
                skillData.reduce((acc, current) => acc + (current[i] ?? 0), 0) / dataPoints[i]

              return Math.round(averageValue * 10) / 10
            }),
          }

          return acc
        },
        {} as Record<
          string,
          {
            values: number[]
            dataPoints: number[]
          }
        >,
      )

      return {
        averages,
        data: data.map((item) => ({
          ...item,
          skills: Object.fromEntries(
            Object.keys(item.skills).map((skillName) => {
              const normalizedData = item.skills[skillName].slice()

              return [skillName, normalizedData]
            }),
          ),
        })),
      }
    },
  )
}

// ...
// Skill      XL: |  1  2  3  4  5  6  7  8  9 10 11 12 13 14 15 16 17 18 19 20 21 22 23 24 25 26 27 |
// ---------------+----------------------------------------------------------------------------------+-----
// Axes           |  4  5     6  7  8  9 10 12 13 14 15 16 17 18 19 20 21 22    23    24             | 24.3
// Throwing       |        1  2  3     4  5  6  7  8                                                 |  8.0
// Fighting       |                    4  5  7  9 11 14 16 17 18 19 20 21 23 24 25 26 27             | 27.0
// Armour         |                    3  5  6  7  9 11 12 14 15 16 18 19 20    21 22 23 24 25    26 | 26.3
// Shields        |                       1  4  6  7 10 11 12 14 15 17 18 20    21 22    23 25    26 | 26.1
// Evocations     |                             1  4                                                 |  4.0
// Dodging        |                                      5  7  9 10          12 14 16 19 21 22    23 | 23.6
// Polearms       |                                                                    9 17 20       | 20.4
// ...

async function parseSkills(filePath: string) {
  const skills = new Map<string, number[]>()

  const filesExists = await fse.pathExists(filePath)

  if (!filesExists) {
    return {}
  }

  const fileContents = await fse.readFile(filePath, 'utf-8')
  const lines = fileContents.split('\n')

  const skillHeadingIndex = lines.findIndex((line) => line.match(/^Skill\s*XL:\s*\|/))
  const skillHeading = lines[skillHeadingIndex]

  const skillLines: {
    name: string
    levelsPart: string
  }[] = []

  if (!skillHeading?.trim()) {
    return {}
  }

  for (let i = skillHeadingIndex + 2; i < lines.length; i++) {
    const match = lines[i].match(/^(\w*).+\|(.+)\|/)

    if (match) {
      const [, name, levelsPart] = match

      skillLines.push({ name, levelsPart })
    } else {
      break
    }
  }

  const headingLevels = skillHeading.match(/^Skill.+\|(.+)\|/) ?? []
  const levelsPart = headingLevels[1]
  const chars = levelsPart.split('')

  for (let i = 0; i < chars.length; i++) {
    const char = chars[i]

    if (char.match(/\s/)) {
      continue
    }

    if (chars[i + 1].match(/\d/)) {
      i++
    }

    for (const skill of skillLines) {
      if (!skills.has(skill.name)) {
        skills.set(skill.name, [])
      }

      const levels = skills.get(skill.name)!
      const skillLevel = parseInt(skill.levelsPart.slice(i - 1, i + 1).trim(), 10)
      const normalizedLevel = isNaN(skillLevel) || skillLevel === 0 ? last(levels) || 0 : skillLevel

      levels.push(normalizedLevel)
    }
  }

  return Object.fromEntries(
    [...skills.entries()].filter(([, levels]) => !levels.every((x) => x === 0)),
  )
}
