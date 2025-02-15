import clsx from 'clsx'
import dayjs from 'dayjs'
import Link from 'next/link'
import { Game } from '~/types'
import { formatDuration, formatNumber, getMorgueUrl } from '~/utils'

export const Table = ({
  games,
  title,
  highlight,
  onLinkClick,
}: {
  games: Game[]
  title: string
  highlight: string
  onLinkClick: (name: string) => void
}) => {
  const tableData = [
    {
      title: 'Player',
      type: 'string',
      getter: (game: Game) => (
        <Link
          prefetch={false}
          href={`/players/${game.name}`}
          className="relative hover:underline"
          onClick={(e) => {
            if (!e.metaKey && !e.ctrlKey) {
              onLinkClick(game.name)
            }
          }}
        >
          {game.name}
        </Link>
      ),
    },
    {
      title: 'Score',
      type: 'number',
      getter: (game: Game) => formatNumber(game.score),
    },
    {
      title: 'Char',
      type: 'string',
      getter: (game: Game) => game.char,
    },
    {
      title: 'God',
      type: 'string',
      getter: (game: Game) => game.god,
    },
    {
      title: 'XL',
      type: 'number',
      getter: (game: Game) => game.xl,
    },
    {
      title: 'Turns',
      type: 'number',
      getter: (game: Game) => formatNumber(game.turns),
    },
    {
      title: 'Duration',
      type: 'string',
      getter: (game: Game) => formatDuration(game.duration),
    },
    {
      title: 'Runes',
      type: 'number',
      getter: (game: Game) => game.runes,
    },
    {
      title: 'Date',
      type: 'string',
      getter: (game: Game) => (
        <span suppressHydrationWarning>{dayjs(game.endAt).format('DD MMM YYYY')}</span>
      ),
    },
    {
      title: 'Version',
      type: 'string',
      getter: (game: Game) => game.version,
    },
  ] as const

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <caption className="pb-1 text-left font-semibold">{title}:</caption>
        <thead>
          <tr>
            {tableData.map(({ title }, index) => (
              <th
                key={title}
                className={clsx(
                  'w-[10%] whitespace-nowrap text-left font-medium md:overflow-visible',
                  index === 0 && 'w-[15%]',
                  index !== 0 && index !== tableData.length && 'px-1',
                )}
              >
                {title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {games.map((game) => (
            <tr
              key={game.id}
              className="relative odd:bg-gray-50 hover:bg-amber-100 dark:odd:bg-zinc-800 dark:hover:bg-zinc-700"
            >
              {tableData.map(({ title, getter }, index) => (
                <td
                  key={title}
                  className={clsx(
                    'whitespace-nowrap text-left tabular-nums md:overflow-visible',
                    highlight === title && 'text-amber-700 dark:text-amber-600',
                    index === 0 && 'relative',
                  )}
                >
                  {index === 0 ? (
                    <>
                      {game.server && (
                        <a
                          target="_blank"
                          rel="noreferrer"
                          className="absolute bottom-0 left-0 right-0 top-0"
                          href={getMorgueUrl(game.server.morgueUrl, game)}
                        />
                      )}
                      {getter(game)}
                    </>
                  ) : (
                    game.server && (
                      <a
                        target="_blank"
                        rel="noreferrer"
                        className={clsx('block', index !== 0 && 'px-1')}
                        href={getMorgueUrl(game.server.morgueUrl, game)}
                      >
                        {getter(game)}
                      </a>
                    )
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
