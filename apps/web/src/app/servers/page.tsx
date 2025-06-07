import { orderBy } from 'lodash-es'
import { Metadata } from 'next'
import { fetchApi } from '~/api/server'
import { sharedOGMetadata } from '~/app/shared-metadata'
import { Logo } from '~/components/Logo'
import { defaultMetaTitle } from '~/constants'
import { Logfile, Server } from '~/types'
import { pluralize, date, formatNumber } from '~/utils'

const title = `Servers | ${defaultMetaTitle}`

export const metadata: Metadata = {
  title,
  openGraph: {
    ...sharedOGMetadata,
    title,
  },
}

const ServersPage = async () => {
  const { servers }: { servers: Array<Server & { logfile: Array<Logfile> }> } = await fetchApi(
    '/servers',
    { next: { revalidate: 300 }, cache: 'force-cache' },
  ).then((r) => r.json())

  return (
    <div className="container mx-auto flex min-h-screen flex-col items-center space-y-4 py-4 pt-4">
      <header>
        <Logo />
      </header>

      <div className="w-full max-w-lg space-y-2">
        <h2 className="text-lg font-semibold">
          Tracking {servers.length} {pluralize('server', servers.length)}:
        </h2>

        {orderBy(
          servers.map((server) => {
            const totalGames = server.logfile.reduce((acc, item) => acc + item.games, 0)

            return {
              ...server,
              totalGames,
            }
          }),
          (server) => server.totalGames,
          'desc',
        ).map((server) => {
          return (
            <div key={server.id} className="rounded border px-2 py-1">
              <div className="flex justify-between">
                <a
                  href={server.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="white-nowrap overflow-hidden text-ellipsis hover:underline"
                >
                  <span className="font-medium">{server.abbreviation}</span> - {server.url}
                </a>
                <div className="whitespace-nowrap">
                  {formatNumber(server.totalGames)} {pluralize('game', server.totalGames)}
                </div>
              </div>
              <details>
                <summary>
                  {server.logfile.length} {pluralize('logfile', server.logfile.length)}
                </summary>
                <ul className="text-sm">
                  {server.logfile
                    .slice()
                    .sort((a, b) =>
                      b.version.localeCompare(a.version, undefined, { numeric: true }),
                    )
                    .map((file) => {
                      return (
                        <li
                          key={file.path}
                          className="flex justify-between px-1 hover:bg-gray-100 dark:hover:bg-zinc-700"
                          title={
                            file.lastFetched && `Last fetched: ${date(file.lastFetched).format()}`
                          }
                        >
                          <a
                            href={server.baseUrl + file.path}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:underline"
                          >
                            {file.path}
                          </a>
                          <div className="whitespace-nowrap">
                            {formatNumber(file.games)} {pluralize('game', file.games)}
                          </div>
                        </li>
                      )
                    })}
                </ul>
              </details>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default ServersPage
