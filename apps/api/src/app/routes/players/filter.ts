import { uniq } from 'lodash-es'
import { getStaticData } from '~/app/getters/getStaticData'
import { Prisma } from '~/generated/prisma/client/client'

export type PlayerFilterQuerystring = {
  servers?: string
}

const parseServers = async (param?: string) => {
  if (!param) {
    return null
  }

  const { servers } = await getStaticData()
  const known = new Set(servers.map((server) => server.abbreviation))
  const selected = uniq(
    param
      .split(',')
      .map((abbreviation) => abbreviation.trim().toUpperCase())
      .filter((abbreviation) => known.has(abbreviation)),
  )

  return selected.length === 0 || selected.length === known.size ? null : selected
}

export const getPlayerFilter = async (query: PlayerFilterQuerystring) => {
  const servers = await parseServers(query.servers)

  return {
    applied: { servers },
    isActive: servers !== null,
    gamesWhere: (servers
      ? { serverAbbreviation: { in: servers } }
      : {}) satisfies Prisma.GameWhereInput,
    sqlCondition: servers
      ? Prisma.sql`AND "serverAbbreviation" IN (${Prisma.join(servers)})`
      : Prisma.empty,
  }
}
