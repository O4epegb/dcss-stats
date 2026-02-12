import { EyeIcon } from '@heroicons/react/24/outline'
import { cacheLife } from 'next/cache'
import Link from 'next/link'
import { PropsWithChildren } from 'react'
import { fetchApi } from '~/api/server'
import { formatDuration, formatNumber } from '~/utils'

const eyesPngList = [
  '/eyes/eye_of_devastation.png',
  '/eyes/glass_eye.png',
  '/eyes/golden_eye.png',
  '/eyes/great_orb_of_eyes.png',
  '/eyes/shining_eye.png',
]

type LiveGame = {
  id: number
  username: string
  spectator_count: number
  game_id: string
  xl: number | null
  char?: string
  place?: string
  turn: number | null
  duration: number | null
  god?: string
  title?: string
  milestone: string
  server: string
  totalWins: number
  totalGames: number
  watchUrl: string
}

type LiveGamesResponse = {
  data: {
    updatedAt: string
    allGamesTotal: number
    games: LiveGame[]
  }
}

const formatWinrate = (wins: number, games: number) => {
  if (games === 0) {
    return '0%'
  }

  return `${((wins / games) * 100).toFixed(1)}%`
}

const getVersionFromGameId = (gameId: string) => {
  const [, version] = gameId.split('-', 2)
  return version || '-'
}

const getEyeImageForPlayer = (playerId: string) => {
  const hash = playerId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return eyesPngList[hash % eyesPngList.length]
}

const skeletonRows = Array.from({ length: 10 }, (_, i) => i)

type LiveGamesTableProps = {
  games?: LiveGame[]
  isSkeleton?: boolean
}

const LiveGamesTable = ({ games, isSkeleton = false }: LiveGamesTableProps) => {
  return (
    <div className="overflow-x-auto rounded border border-gray-200 dark:border-zinc-700">
      <table className="min-w-full text-left text-xs sm:text-sm">
        <thead className="bg-gray-50 text-gray-700 dark:bg-zinc-800 dark:text-zinc-300">
          <tr>
            <th className="px-2 py-1.5 font-semibold">Player</th>
            <th className="px-2 py-1.5 font-semibold">Watch</th>
            <th className="px-2 py-1.5 font-semibold">Record</th>
            <th className="px-2 py-1.5 font-semibold">Char</th>
            <th className="px-2 py-1.5 font-semibold">XL</th>
            <th className="px-2 py-1.5 font-semibold">Turns</th>
            <th className="px-2 py-1.5 font-semibold">Time</th>
            <th className="px-2 py-1.5 font-semibold">Where</th>
            <th className="px-2 py-1.5 font-semibold">Milestone</th>
            <th className="px-2 py-1.5 font-semibold" />
          </tr>
        </thead>
        <tbody>
          {isSkeleton
            ? skeletonRows.map((row) => (
                <tr key={row} className="border-t border-gray-200 dark:border-zinc-700">
                  <td className="h-[33px] px-2 py-1.5">
                    <div className="h-4 w-20 animate-pulse rounded bg-gray-200 dark:bg-zinc-700" />
                  </td>
                  <td className="h-[33px] px-2 py-1.5">
                    <div className="h-4 w-10 animate-pulse rounded bg-gray-200 dark:bg-zinc-700" />
                  </td>
                  <td className="h-[33px] px-2 py-1.5">
                    <div className="h-4 w-24 animate-pulse rounded bg-gray-200 dark:bg-zinc-700" />
                  </td>
                  <td className="h-[33px] px-2 py-1.5">
                    <div className="h-4 w-28 animate-pulse rounded bg-gray-200 dark:bg-zinc-700" />
                  </td>
                  <td className="h-[33px] px-2 py-1.5">
                    <div className="h-4 w-6 animate-pulse rounded bg-gray-200 dark:bg-zinc-700" />
                  </td>
                  <td className="h-[33px] px-2 py-1.5">
                    <div className="h-4 w-16 animate-pulse rounded bg-gray-200 dark:bg-zinc-700" />
                  </td>
                  <td className="h-[33px] px-2 py-1.5">
                    <div className="h-4 w-16 animate-pulse rounded bg-gray-200 dark:bg-zinc-700" />
                  </td>
                  <td className="h-[33px] px-2 py-1.5">
                    <div className="h-4 w-20 animate-pulse rounded bg-gray-200 dark:bg-zinc-700" />
                  </td>
                  <td className="h-[33px] px-2 py-1.5">
                    <div className="h-4 w-28 animate-pulse rounded bg-gray-200 dark:bg-zinc-700" />
                  </td>
                  <td className="h-[33px] px-2 py-1.5">
                    <div className="ml-auto h-4 w-12 animate-pulse rounded bg-gray-200 dark:bg-zinc-700" />
                  </td>
                </tr>
              ))
            : games?.map((game) => (
                <tr key={game.id} className="border-t border-gray-200 dark:border-zinc-700">
                  <td className="px-2 py-1.5 whitespace-nowrap">
                    <Link
                      href={`/players/${game.username}`}
                      className="font-medium hover:underline"
                    >
                      {game.username}
                    </Link>
                  </td>
                  <td className="px-2 py-1.5 whitespace-nowrap">
                    <a
                      href={game.watchUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="group flex w-max items-center justify-start gap-1 rounded hover:bg-gray-100 dark:hover:bg-zinc-800"
                      title={`Watch ${game.username}`}
                      aria-label={`Watch ${game.username}`}
                    >
                      <span className="relative block h-5 w-5 shrink-0">
                        <EyeIcon className="absolute inset-0 h-5 w-5 group-hover:hidden" />
                        <img
                          src={getEyeImageForPlayer(game.username)}
                          alt="Watch"
                          width={20}
                          height={20}
                          className="absolute inset-0 hidden h-5 w-5 object-contain group-hover:block"
                        />
                      </span>{' '}
                      {game.spectator_count > 0 && `(${game.spectator_count})`}
                    </a>
                  </td>
                  <td className="px-2 py-1.5 whitespace-nowrap">
                    {formatNumber(game.totalWins)}/{formatNumber(game.totalGames)} (
                    {formatWinrate(game.totalWins, game.totalGames)})
                  </td>
                  <td className="px-2 py-1.5 whitespace-nowrap">
                    {game.char || '-'}
                    {game.god ? (
                      <>
                        {' '}
                        <span className="opacity-50">of</span> {game.god}
                      </>
                    ) : (
                      ''
                    )}
                  </td>
                  <td className="px-2 py-1.5 whitespace-nowrap tabular-nums">{game.xl ?? '-'}</td>
                  <td className="px-2 py-1.5 whitespace-nowrap tabular-nums">
                    {game.turn ? formatNumber(game.turn) : '-'}
                  </td>
                  <td className="px-2 py-1.5 whitespace-nowrap tabular-nums">
                    {game.duration !== null ? formatDuration(game.duration) : '-'}
                  </td>

                  <td className="px-2 py-1.5">
                    <span className="line-clamp-1">{game.place || '-'}</span>
                  </td>
                  <td className="px-2 py-1.5">
                    <span className="line-clamp-1">{game.milestone || '-'}</span>
                  </td>
                  <td className="text-2xs px-2 whitespace-nowrap text-gray-500 dark:text-zinc-400">
                    <div className="flex flex-col items-end justify-center gap-0.5 leading-none">
                      {game.server} <span>{getVersionFromGameId(game.game_id)}</span>
                    </div>
                  </td>
                </tr>
              ))}
        </tbody>
      </table>
    </div>
  )
}

const LiveGamesSection = ({ children }: PropsWithChildren) => {
  return (
    <section className="space-y-2">
      <div className="flex items-end justify-between gap-3">
        <h2 className="text-xl font-semibold">Live games</h2>
      </div>
      {children}
    </section>
  )
}

export const LiveGamesSkeleton = () => {
  return (
    <LiveGamesSection>
      <LiveGamesTable isSkeleton />
    </LiveGamesSection>
  )
}

export const LiveGames = async () => {
  'use cache'

  cacheLife({
    stale: 20,
    revalidate: 30,
    expire: 120,
  })

  const response: LiveGamesResponse = await fetchApi('/live-games').then((r) => r.json())
  const { games } = response.data

  if (games.length === 0) {
    return null
  }

  return (
    <LiveGamesSection>
      <LiveGamesTable games={games} />
    </LiveGamesSection>
  )
}
