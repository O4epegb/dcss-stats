import { AppType } from '~/app/app'
import { createCache, type CacheManager } from '~/app/cache'
import { prisma } from '~/prisma'

export const serversRoute = (
  app: AppType,
  {
    cache = createCache({ revalidate: 60, expire: 300, maxEntries: 1 }),
  }: { cache?: CacheManager } = {},
) => {
  app.get('/api/servers', async () => {
    return cache.get({
      key: '/api/servers',
      loader: async () => {
        const [servers, logfiles] = await Promise.all([
          prisma.server.findMany(),
          prisma.logfile.findMany({
            include: {
              _count: {
                select: {
                  game: true,
                },
              },
            },
          }),
        ])

        return {
          servers: servers.map((server) => {
            return {
              ...server,
              logfile: logfiles
                .filter((x) => x.serverId === server.id)
                .map(({ _count, path, version, id, lastFetched }) => ({
                  id,
                  path,
                  version,
                  games: _count?.game,
                  lastFetched,
                })),
            }
          }),
        }
      },
    })
  })
}
