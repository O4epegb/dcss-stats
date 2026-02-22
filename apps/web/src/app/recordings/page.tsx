'use client'

import { type PlayerInstance } from 'asciinema-player'
import clsx from 'clsx'
import { omit } from 'lodash-es'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useMemo, useRef, useState } from 'react'
import useSWRImmutable from 'swr/immutable'
import useMutation from 'swr/mutation'
import { api } from '~/api'
import { FilterItemType, Filters } from '~/components/Filters'
import { GameCard } from '~/components/GameCard'
import { Logo } from '~/components/Logo'
import { ThemeSelector } from '~/components/ThemeSelector'
import { Loader } from '~/components/ui/Loader'
import { Game, StaticData } from '~/types'
import { cn } from '~/utils'

import 'asciinema-player/dist/bundle/asciinema-player.css'

export default function RecordingsPage() {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const asciiPlayerRef = useRef<PlayerInstance | null>(null)
  const asciiPlayerContainerRef = useRef<HTMLDivElement | null>(null)

  const player = params.get('player') ?? undefined
  const startAt = params.get('startAt') ?? undefined
  const hasRequiredFilters = !!player && !!startAt

  const [selectedRecordingLink, setSelectedRecordingLink] = useState<string | null>(null)
  const [filterForSearch, setFilterForSearch] = useState<FilterItemType[] | null>(() => null)
  const [isPreparingPlayer, setIsPreparingPlayer] = useState(false)
  const [playerError, setPlayerError] = useState<string | null>(null)

  const {
    data: staticData,
    isLoading: staticDataLoading,
    error: staticDataError,
  } = useSWRImmutable('/static-data', (url) => api.get<StaticData>(url).then((res) => res.data), {
    shouldRetryOnError: false,
  })

  const serversWithTtyrecFilter: Omit<FilterItemType, 'id'>[] = useMemo(() => {
    return (staticData?.servers ?? [])
      .filter((server) => server.ttyrecUrl)
      .map((server) => ({
        option: 'Server',
        condition: 'is',
        suboption: undefined,
        operator: 'or',
        value: server.abbreviation,
      }))
  }, [staticData?.servers])

  const {
    data: searchData,
    isLoading: searchLoading,
    error: searchError,
  } = useSWRImmutable(
    () => {
      if (hasRequiredFilters || !staticData) {
        return null
      }

      return ['/search', { filter: serversWithTtyrecFilter.concat(filterForSearch ?? []) }]
    },
    ([url, { filter }]) =>
      api
        .get<{ data: Game[]; count: number }>(url, {
          params: filter
            ? {
                filter: filter.map((x: FilterItemType | Omit<FilterItemType, 'id'>) =>
                  omit(x, 'id'),
                ),
              }
            : undefined,
        })
        .then((res) => res.data),
    {
      shouldRetryOnError: false,
    },
  )

  const {
    data,
    isLoading: gameLoading,
    error: gameError,
  } = useSWRImmutable(
    () => {
      if (!hasRequiredFilters) {
        return null
      }

      return [
        '/search',
        {
          player,
          startAt,
        },
      ]
    },
    ([url, filters]) =>
      api
        .get<{ data: Game[]; count: number }>(url, {
          params: {
            filter: [
              {
                option: 'Player',
                condition: 'is',
                operator: 'and',
                value: filters.player,
              },
              {
                option: 'StartAt',
                condition: '=',
                operator: 'and',
                value: filters.startAt,
              },
              ...serversWithTtyrecFilter,
            ] as FilterItemType[],
          },
        })
        .then((res) => res.data),
  )

  const game = data?.data?.[0]
  const {
    data: recordingData,
    isLoading: recordingLoading,
    error: recordingsError,
  } = useSWRImmutable(
    () =>
      game
        ? [
            '/ttyrec/recordings',
            {
              player: game.name,
              server: game.server?.abbreviation,
              startAt: game.startAt,
            },
          ]
        : null,
    ([url, params]) =>
      api
        .get<{ data: { link: string; date: string }[] }>(url, {
          params,
        })
        .then((res) => res.data),
    {
      shouldRetryOnError: false,
    },
  )

  const { trigger: triggerRawTtyrec, isMutating: rawRecordingLoading } = useMutation(
    '/ttyrec/raw',
    (url, { arg: recordingLink }: { arg: string }) =>
      api
        .get<Blob>(url, {
          responseType: 'blob',
          params: {
            url: recordingLink,
          },
        })
        .then((res) => res.data),
  )

  const potentialRecordings = recordingData?.data ?? []
  const potentialGames = searchData?.data ?? []
  const selectedRecording =
    potentialRecordings.find((rec) => rec.link === selectedRecordingLink) ?? null
  const isPlayerBusy = isPreparingPlayer || rawRecordingLoading

  const clearAsciiPlayer = () => {
    asciiPlayerRef.current?.dispose()
    asciiPlayerRef.current = null

    if (asciiPlayerContainerRef.current) {
      asciiPlayerContainerRef.current.innerHTML = ''
    }
  }

  const handleSelectGame = (selectedGame: Game) => {
    const nextParams = new URLSearchParams(params.toString())
    nextParams.set('player', selectedGame.name)
    nextParams.set('startAt', selectedGame.startAt)

    router.replace(`${pathname}?${nextParams.toString()}`)
  }

  const handlePlayRawTtyrec = async (recording: { link: string; date: string }) => {
    if (!asciiPlayerContainerRef.current || isPlayerBusy) {
      return
    }

    setSelectedRecordingLink(recording.link)
    setPlayerError(null)
    setIsPreparingPlayer(true)

    try {
      const AsciinemaPlayer = await import('asciinema-player')

      clearAsciiPlayer()

      asciiPlayerRef.current = AsciinemaPlayer.create(
        {
          data: triggerRawTtyrec(recording.link),
          parser: 'ttyrec',
          fit: 'width',
        },
        asciiPlayerContainerRef.current,
        {
          autoPlay: true,
        },
      )
    } catch (e) {
      setPlayerError('Could not load this recording. Please try another one.')
      throw e
    } finally {
      setIsPreparingPlayer(false)
    }
  }

  return (
    <main className="container mx-auto flex min-h-dvh flex-col items-center px-4">
      <div className="w-full max-w-5xl space-y-4 py-4">
        <header className="flex w-full items-center gap-4">
          <Logo />
          <ThemeSelector className="ml-auto" />
        </header>

        <div className="flex flex-wrap items-center justify-between gap-1">
          <h2 className="text-xl font-semibold">Game recordings</h2>
          {game && (
            <button
              type="button"
              className="rounded-sm border border-gray-300 px-2 py-1 text-sm hover:bg-gray-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
              onClick={() => {
                router.replace(pathname)

                clearAsciiPlayer()
              }}
            >
              Clear game
            </button>
          )}
          {staticData?.servers && (
            <div className="w-full text-sm text-gray-500 dark:text-gray-400">
              Supported servers:{' '}
              {staticData.servers
                .filter((server) => server.ttyrecUrl)
                .map((server) => server.abbreviation)
                .join(', ')}
            </div>
          )}
        </div>

        {!hasRequiredFilters && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-4">
              {staticDataLoading ? (
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                  <Loader />
                  <span>Loading filters…</span>
                </div>
              ) : (
                <>
                  {staticDataError && (
                    <div className="rounded-sm border border-red-200 bg-red-50 p-3 text-sm text-red-900 dark:border-red-900 dark:bg-red-900/20 dark:text-red-100">
                      Could not load filters.
                    </div>
                  )}

                  {staticData && (
                    <Filters
                      excludeFilters={['Server']}
                      replaceQuery={false}
                      filterOptions={staticData.filterOptions}
                      onSubmit={(filters) => setFilterForSearch(filters)}
                    />
                  )}
                </>
              )}
            </div>

            <div className="flex min-h-[500px] flex-col gap-3">
              <div>
                <h3 className="text-lg font-semibold">Pick a game to load recordings</h3>
              </div>

              {searchLoading && (
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                  <Loader />
                  <span>Searching games…</span>
                </div>
              )}

              {searchError && (
                <div className="rounded-sm border border-red-200 bg-red-50 p-3 text-sm text-red-900 dark:border-red-900 dark:bg-red-900/20 dark:text-red-100">
                  Could not search games.
                </div>
              )}

              {!searchError && !searchLoading && potentialGames.length === 0 && (
                <div className="rounded-sm border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                  No games to show. Try adjusting filters.
                </div>
              )}

              {!searchLoading && potentialGames.length > 0 && (
                <div className="flex-1 basis-0 space-y-2 overflow-y-auto">
                  {potentialGames.map((candidateGame) => (
                    <div
                      key={candidateGame.id}
                      role="button"
                      tabIndex={0}
                      className="cursor-pointer rounded-sm transition-colors hover:bg-gray-100/60 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none dark:hover:bg-zinc-800/60"
                      onClick={(event) => {
                        if ((event.target as HTMLElement).closest('a,button')) {
                          return
                        }

                        handleSelectGame(candidateGame)
                      }}
                      onKeyDown={(event) => {
                        if (event.key !== 'Enter' && event.key !== ' ') {
                          return
                        }

                        event.preventDefault()
                        handleSelectGame(candidateGame)
                      }}
                    >
                      <GameCard includePlayer game={candidateGame} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {gameLoading && (
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
            <Loader />
            <span>Loading game details…</span>
          </div>
        )}

        {gameError && (
          <div className="rounded-sm border border-red-200 bg-red-50 p-3 text-sm text-red-900 dark:border-red-900 dark:bg-red-900/20 dark:text-red-100">
            Could not load game details.
          </div>
        )}

        {!gameLoading && hasRequiredFilters && !game && !gameError && (
          <div className="rounded-sm border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
            No game found for the provided parameters.
          </div>
        )}

        {game && (
          <div className="space-y-3">
            <GameCard game={game} />
          </div>
        )}

        {game && (
          <>
            {recordingLoading ? (
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                <Loader />
                <span>Loading recordings...</span>
              </div>
            ) : (
              <>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-semibold">Potential recordings</h3>
                    {!recordingLoading && potentialRecordings.length > 0 && (
                      <span className="text-lg text-gray-500 dark:text-gray-400">
                        {potentialRecordings.length} found
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Select ttyrec file to play it
                  </p>
                </div>

                {recordingsError && (
                  <div className="rounded-sm border border-red-200 bg-red-50 p-3 text-sm text-red-900 dark:border-red-900 dark:bg-red-900/20 dark:text-red-100">
                    Could not load recordings for this game.
                  </div>
                )}

                {!recordingLoading && !recordingsError && potentialRecordings.length === 0 && (
                  <div className="rounded-sm border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                    No recording candidates were found.
                  </div>
                )}

                {!recordingLoading && potentialRecordings.length > 0 && (
                  <div className="space-y-3">
                    <div className="max-h-72 space-y-2 overflow-y-auto">
                      {potentialRecordings.map((rec) => {
                        const isSelected = rec.link === selectedRecording?.link

                        return (
                          <button
                            key={rec.link}
                            type="button"
                            disabled={isPlayerBusy}
                            className={clsx(
                              'w-full rounded-sm border px-3 py-2 text-left text-sm transition-colors',
                              isSelected
                                ? 'border-emerald-400 bg-emerald-50 dark:border-emerald-500 dark:bg-emerald-900/20'
                                : 'border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-gray-100 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:border-zinc-600 dark:hover:bg-zinc-700/70',
                              isPlayerBusy &&
                                'cursor-not-allowed opacity-60 hover:border-gray-200 hover:bg-gray-50 dark:hover:border-zinc-700 dark:hover:bg-zinc-800',
                            )}
                            onClick={() => {
                              void handlePlayRawTtyrec(rec)
                            }}
                          >
                            <div className="font-medium">{formatRecordingDate(rec.date)}</div>
                            <div className="truncate text-xs text-gray-500 dark:text-gray-400">
                              {rec.link}
                            </div>
                          </button>
                        )
                      })}
                    </div>

                    {isPlayerBusy && (
                      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                        <Loader />
                        Loading selected recording…
                      </div>
                    )}

                    {playerError && (
                      <div className="rounded-sm border border-red-200 bg-red-50 p-3 text-sm text-red-900 dark:border-red-900 dark:bg-red-900/20 dark:text-red-100">
                        {playerError}
                      </div>
                    )}

                    <div
                      className={cn(
                        'rounded-sm border border-gray-300 p-2 dark:border-zinc-700',
                        !selectedRecording && 'hidden',
                      )}
                    >
                      <div ref={asciiPlayerContainerRef} />
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </main>
  )
}

const formatRecordingDate = (value: string) => {
  const parsedDate = new Date(value)

  if (Number.isNaN(parsedDate.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(parsedDate)
}
