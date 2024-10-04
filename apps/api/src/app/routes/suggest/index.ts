import { Static, Type } from '@sinclair/typebox'
import { AppType } from '~/app/app'
import { cache, ttl } from '~/app/cache'
import { getCombosData } from '~/app/getters/getCombosData'
import { getStaticData } from '~/app/getters/getStaticData'
import { filterQuerystringPart, getWhereQueryFromFilter } from '~/app/routes/search'
import { prisma } from '~/prisma'

export const suggestRoute = (app: AppType) => {
  const SuggestQuery = Type.Object({
    race: Type.Optional(Type.String()),
    class: Type.Optional(Type.String()),
    god: Type.Optional(Type.String()),
    version: Type.Optional(Type.String()),
    noCache: Type.Optional(Type.Boolean()),
    filter: filterQuerystringPart,
  })
  type SuggestQueryType = Static<typeof SuggestQuery>

  app.get<{ Querystring: SuggestQueryType }>(
    '/api/suggest',
    { schema: { querystring: SuggestQuery } },
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

      const cacheKey = request.url.toLowerCase()
      const cached = request.query.noCache ? false : cache.get(cacheKey)

      const getData = async () => {
        const where = await getWhereQueryFromFilter(filter)
        const [gamesByChar, winsByChar, combosData] = await Promise.all([
          prisma.game.groupBy({
            by: ['char'],
            where: { ...where, versionShort },
            _count: { _all: true },
          }),
          prisma.game.groupBy({
            by: ['char'],
            where: { ...where, versionShort, isWin: true },
            _count: { _all: true },
          }),
          getCombosData({
            where: {
              ...where,
              normalizedRace: race && !race.isSubRace ? race.name : undefined,
              race: race && race.isSubRace ? race.name : undefined,
              normalizedClass: cls?.name,
              god: god?.name,
              versionShort: version ?? versions[0],
            },
            take: 100000,
          }),
        ])

        const matrix = gamesByChar.map((game) => {
          const games = game._count._all
          const wins = winsByChar.find((x) => x.char === game.char)?._count._all ?? 0
          const winrate = Math.round((wins / games) * 100) / 100

          return {
            char: game.char,
            games,
            wins,
            winrate,
          }
        })

        return {
          matrix,
          ...combosData,
        }
      }

      if (!cached || Date.now() - cached.ttl > ttl) {
        cache.set(cacheKey, { promise: getData(), ttl: Date.now() })
      }

      return cache.get(cacheKey)?.promise
    },
  )
}
