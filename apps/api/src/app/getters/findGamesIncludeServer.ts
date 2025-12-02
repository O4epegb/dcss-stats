import { Prisma } from '~/generated/prisma/client/client'
import { prisma } from '~/prisma'
import { GameWithLogfileAndServer } from '~/types'

export const findGamesIncludeServer = async (
  args?: Omit<Prisma.GameFindManyArgs, 'select' | 'include'>,
  includePlayer?: boolean,
) => {
  return prisma.game
    .findMany({
      ...args,
      include: {
        player: Boolean(includePlayer),
        logfile: {
          include: {
            server: true,
          },
        },
      },
    })
    .then((games) => {
      return processGamesWithLogfile(games)
    })
}

const processGamesWithLogfile = (games: GameWithLogfileAndServer[]) => {
  return games.map(({ logfile, logfileId, ...rest }) => {
    return Object.assign(rest, {
      server: {
        ...logfile.server,
        morgueUrl: logfile.server.morgueUrl + (logfile.morgueUrlPrefix ?? ''),
      },
    })
  })
}
