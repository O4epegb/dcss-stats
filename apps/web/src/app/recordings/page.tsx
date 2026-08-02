'use client'

import { omit } from 'lodash-es'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useMemo, useState } from 'react'
import useSWRImmutable from 'swr/immutable'
import { api } from '~/api'
import { FilterItemType, Filters } from '~/components/Filters'
import { GameCard } from '~/components/GameCard'
import { HeaderWithMenu } from '~/components/HeaderWithMenu'
import { Loader } from '~/components/ui/Loader'
import { Game, StaticData } from '~/types'
import { cn } from '~/utils'
import { LocalRecordingDialog } from './LocalRecordingDialog'
import { prepareTtyrecFile } from './prepareTtyrecFile'
import { TtyrecPlayer, type TtyrecSource } from './TtyrecPlayer'
import 'asciinema-player/dist/bundle/asciinema-player.css'

type PlaybackSource = TtyrecSource & {
  kind: 'local' | 'remote'
}

export default function RecordingsPage() {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()

  const player = params.get('player') ?? undefined
  const startAt = params.get('startAt') ?? undefined
  const hasRequiredFilters = !!player && !!startAt

  const [filterForSearch, setFilterForSearch] = useState<FilterItemType[] | null>(() => null)
  const [playbackSource, setPlaybackSource] = useState<PlaybackSource | null>(null)
  const [isPlayerBusy, setIsPlayerBusy] = useState(false)

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
      .map((server, index, array) => ({
        option: 'Server',
        condition: 'is',
        suboption: undefined,
        operator: index === array.length - 1 ? 'and' : 'or',
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
                skipCount: true,
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
            skipCount: true,
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
        .get<{ data: { link: string; date: string; size?: string }[] }>(url, {
          params,
        })
        .then((res) => res.data),
    {
      shouldRetryOnError: false,
    },
  )

  const potentialRecordings = recordingData?.data ?? []
  const potentialGames = searchData?.data ?? []

  const handleSelectGame = (selectedGame: Game) => {
    setPlaybackSource(null)

    const nextParams = new URLSearchParams(params.toString())
    nextParams.set('player', selectedGame.name)
    nextParams.set('startAt', selectedGame.startAt)

    router.replace(`${pathname}?${nextParams.toString()}`)
  }

  const handlePlayRawTtyrec = (recording: { link: string; date: string }) => {
    if (isPlayerBusy) {
      return
    }

    setPlaybackSource({
      kind: 'remote',
      id: recording.link,
      label: formatRecordingDate(recording.date),
      load: loadOnce(() =>
        api
          .get<Blob>('/ttyrec/raw', {
            responseType: 'blob',
            params: {
              url: recording.link,
            },
          })
          .then((res) => res.data)
          .catch(() => {
            throw new Error('Could not load this recording. Please try another one.')
          }),
      ),
    })
  }

  const handlePlayLocalTtyrec = (file: File) => {
    if (isPlayerBusy) {
      return
    }

    setPlaybackSource({
      kind: 'local',
      id: `${file.name}:${file.size}:${file.lastModified}`,
      label: file.name,
      load: loadOnce(() => prepareTtyrecFile(file)),
    })
  }

  const loadingSearchOrStaticData = searchLoading || staticDataLoading
  const localPlaybackSource = playbackSource?.kind === 'local' ? playbackSource : null

  return (
    <main className="mx-auto min-h-dvh w-full max-w-5xl items-center space-y-4 p-4">
      <HeaderWithMenu />

      <div className="flex flex-wrap items-center justify-between gap-1">
        <h2 className="text-page-heading text-xl font-semibold">Game recordings</h2>
        {localPlaybackSource ? (
          <button
            type="button"
            className="border-border hover:bg-surface-hover rounded-sm border px-3 py-1.5 text-sm"
            onClick={() => setPlaybackSource(null)}
          >
            Clear file
          </button>
        ) : game ? (
          <button
            type="button"
            className="border-border hover:bg-surface-hover rounded-sm border px-3 py-1.5 text-sm"
            onClick={() => {
              router.replace(pathname)
              setPlaybackSource(null)
            }}
          >
            Clear game
          </button>
        ) : (
          <LocalRecordingDialog disabled={isPlayerBusy} onSelect={handlePlayLocalTtyrec} />
        )}
        {!localPlaybackSource && staticData?.servers && (
          <div className="text-muted-foreground w-full text-sm">
            Supported servers:{' '}
            {staticData.servers
              .filter((server) => server.ttyrecUrl)
              .map((server) => server.abbreviation)
              .join(', ')}
          </div>
        )}
      </div>

      {localPlaybackSource ? (
        <TtyrecPlayer source={localPlaybackSource} onBusyChange={setIsPlayerBusy} />
      ) : (
        <>
          {!hasRequiredFilters && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-4">
                {staticDataLoading ? (
                  <div className="text-muted-foreground flex items-center gap-2 text-sm">
                    <Loader />
                    <span>Loading filters…</span>
                  </div>
                ) : (
                  <>
                    {staticDataError && (
                      <div className="border-danger-border bg-danger-surface text-danger-foreground rounded-sm border p-3 text-sm">
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

                {loadingSearchOrStaticData && (
                  <div className="text-muted-foreground flex items-center gap-2 text-sm">
                    <Loader />
                    <span>Searching games…</span>
                  </div>
                )}

                {searchError && (
                  <div className="border-danger-border bg-danger-surface text-danger-foreground rounded-sm border p-3 text-sm">
                    Could not search games.
                  </div>
                )}

                {!loadingSearchOrStaticData && !searchLoading && potentialGames.length === 0 && (
                  <div className="border-border bg-surface-muted text-muted-foreground rounded-sm border p-3 text-sm">
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
                        className="hover:bg-surface-hover/60 focus-visible:ring-focus-ring cursor-pointer rounded-sm transition-colors focus-visible:ring-2 focus-visible:outline-none"
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
            <div className="text-muted-foreground flex items-center gap-2 text-sm">
              <Loader />
              <span>Loading game details…</span>
            </div>
          )}

          {gameError && (
            <div className="border-danger-border bg-danger-surface text-danger-foreground rounded-sm border p-3 text-sm">
              Could not load game details.
            </div>
          )}

          {!gameLoading && hasRequiredFilters && !game && !gameError && (
            <div className="border-border bg-surface-muted text-muted-foreground rounded-sm border p-3 text-sm">
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
                <div className="text-muted-foreground flex items-center gap-2 text-sm">
                  <Loader />
                  <span>Loading recordings...</span>
                </div>
              ) : (
                <>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-semibold">Potential recordings</h3>
                      {!recordingLoading && potentialRecordings.length > 0 && (
                        <span className="text-muted-foreground text-lg">
                          {potentialRecordings.length} found
                        </span>
                      )}
                    </div>
                    <p className="text-muted-foreground text-sm">Select ttyrec file to play it</p>
                  </div>

                  {recordingsError && (
                    <div className="border-danger-border bg-danger-surface text-danger-foreground rounded-sm border p-3 text-sm">
                      Could not load recordings for this game.
                    </div>
                  )}

                  {!recordingLoading && !recordingsError && potentialRecordings.length === 0 && (
                    <div className="border-border bg-surface-muted text-muted-foreground rounded-sm border p-3 text-sm">
                      No recording candidates were found.
                    </div>
                  )}

                  {!recordingLoading && potentialRecordings.length > 0 && (
                    <div className="space-y-3">
                      <div className="max-h-72 space-y-2 overflow-y-auto">
                        {potentialRecordings.map((rec) => {
                          const isSelected =
                            playbackSource?.kind === 'remote' && rec.link === playbackSource.id

                          return (
                            <button
                              key={rec.link}
                              type="button"
                              disabled={isPlayerBusy}
                              className={cn(
                                'w-full rounded-sm border px-3 py-2 text-left text-sm transition-colors',
                                isSelected
                                  ? 'border-success-border bg-success-surface'
                                  : 'border-border bg-surface-muted hover:border-border-strong hover:bg-surface-hover',
                                isPlayerBusy &&
                                  'hover:border-border hover:bg-surface-muted cursor-not-allowed opacity-60',
                              )}
                              onClick={() => {
                                handlePlayRawTtyrec(rec)
                              }}
                            >
                              <div className="font-medium">
                                {formatRecordingDate(rec.date)}{' '}
                                {rec.size ? (
                                  <span className="text-muted-foreground">({rec.size})</span>
                                ) : null}
                              </div>
                              <div className="text-muted-foreground truncate text-xs">
                                {rec.link}
                              </div>
                            </button>
                          )
                        })}
                      </div>

                      {playbackSource?.kind === 'remote' && (
                        <TtyrecPlayer source={playbackSource} onBusyChange={setIsPlayerBusy} />
                      )}
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </>
      )}
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

const loadOnce = (load: () => Promise<Blob>) => {
  let result: Promise<Blob> | undefined

  return () => {
    result ??= load()
    return result
  }
}
