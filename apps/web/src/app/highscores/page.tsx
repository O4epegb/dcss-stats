import { ArrowTopRightOnSquareIcon } from '@heroicons/react/16/solid'
import { ChevronDoubleLeftIcon, ChevronDoubleRightIcon } from '@heroicons/react/24/outline'
import { Metadata } from 'next'
import Link from 'next/link'
import { fetchApi } from '~/api/server'
import { sharedOGMetadata } from '~/app/shared-metadata'
import { defaultMetaTitle } from '~/constants'
import { HighscoresResponse } from '~/types'
import { cn, date, formatDuration, formatNumber, getMorgueUrl, pluralize } from '~/utils'

const title = `Highscores | ${defaultMetaTitle}`

export const metadata: Metadata = {
  title,
  openGraph: {
    ...sharedOGMetadata,
    title,
  },
}

type SearchParams = {
  [key: string]: string | string[] | undefined
}

const kinds = [
  { value: 'HIGHSCORE' as const, label: 'Score' },
  { value: 'TURN_COUNT' as const, label: 'Turncount' },
  { value: 'DURATION' as const, label: 'Speedrun' },
]

const runeTiersByKind: Record<string, { value?: string; label: string }[]> = {
  HIGHSCORE: [
    { value: undefined, label: 'All runes' },
    { value: 'TIER_1', label: '3 Runes' },
    { value: 'TIER_2', label: '4+ Runes' },
  ],
  TURN_COUNT: [
    { value: undefined, label: 'All runes' },
    { value: 'TIER_1', label: '3-14 Runes' },
    { value: 'TIER_2', label: '15 Runes' },
  ],
  DURATION: [
    { value: undefined, label: 'All runes' },
    { value: 'TIER_1', label: '3-14 Runes' },
    { value: 'TIER_2', label: '15 Runes' },
  ],
}

const PER_PAGE = 100

export default async function HighscoresPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const page = Number(params.page) || 1
  const skip = (page - 1) * PER_PAGE
  const kind = (params.kind as string) ?? 'HIGHSCORE'

  const fetchParams = new URLSearchParams()
  fetchParams.append('kind', kind)
  fetchParams.append('breakdown', String(params.breakdown ?? 'CHAR'))
  fetchParams.append('runeTier', String(params.runeTier ?? 'ALL'))
  if (params.player) {
    fetchParams.append('player', String(params.player))
  }
  fetchParams.append('skip', String(skip))
  fetchParams.append('take', String(PER_PAGE))

  const { data, total }: HighscoresResponse = await fetchApi(
    '/highscores?' + fetchParams.toString(),
  ).then((r) => r.json())

  const totalPages = Math.ceil(total / PER_PAGE)

  const paginationQuery = (pageNum: number) => ({
    pathname: '/highscores' as const,
    query: {
      kind: params.kind,
      breakdown: params.breakdown,
      runeTier: params.runeTier,
      player: params.player,
      page: pageNum > 1 ? String(pageNum) : undefined,
    },
  })

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex gap-1">
          {kinds.map((k) => (
            <Link
              key={k.value}
              prefetch={false}
              href={{
                pathname: '/highscores',
                query: {
                  kind: k.value,
                  breakdown: params.breakdown,
                  runeTier: params.runeTier,
                  player: params.player,
                },
              }}
              className={cn(
                'rounded px-2 py-0.5 text-sm',
                kind === k.value ? 'bg-surface-active font-medium' : 'hover:bg-surface-hover',
              )}
            >
              {k.label}
            </Link>
          ))}
        </div>
        <span className="text-border-strong">|</span>
        <div className="flex gap-1">
          {(runeTiersByKind[kind] ?? runeTiersByKind.HIGHSCORE).map((r) => (
            <Link
              key={r.label}
              prefetch={false}
              href={{
                pathname: '/highscores',
                query: {
                  kind: params.kind,
                  breakdown: params.breakdown,
                  runeTier: r.value,
                  player: params.player,
                },
              }}
              className={cn(
                'rounded px-2 py-0.5 text-sm',
                params.runeTier === r.value || (!params.runeTier && !r.value)
                  ? 'bg-surface-active font-medium'
                  : 'hover:bg-surface-hover',
              )}
            >
              {r.label}
            </Link>
          ))}
        </div>
      </div>

      {data.length === 0 && (
        <div className="text-muted-foreground flex flex-col items-center gap-2 py-8 text-center">
          <span className="text-xl">¯\_(ツ)_/¯</span>
          <div>No highscores found.</div>
        </div>
      )}

      {data.length > 0 && (
        <div className="divide-border divide-y overflow-hidden rounded-sm">
          {data.map((entry, index) => {
            const game = entry.game

            return (
              <div
                key={`${entry.gameId}-${entry.breakdown}-${entry.runeTier}`}
                className="bg-surface text-foreground flex gap-3 py-2 text-sm"
              >
                <div className="min-w-0 flex-1">
                  <div className="font-medium">
                    <span className="text-muted-foreground mr-1.5 shrink-0 font-mono">
                      {skip + index + 1}.
                    </span>
                    <Link
                      prefetch={false}
                      href={`/players/${entry.player.name}`}
                      className="hover:underline"
                    >
                      {entry.player.name}
                    </Link>
                  </div>
                  {params.player && (
                    <div className="text-muted-foreground text-xs">
                      #{entry.rank} in {entry.breakdown.toLowerCase()} breakdown
                    </div>
                  )}
                  <div>
                    {entry.char}
                    {game.god && <span className="font-light"> of {game.god}</span>},{' '}
                    <span className={game.isWin ? 'text-success' : 'text-danger'}>
                      {game.isWin ? 'escaped' : game.endMessage}
                    </span>
                    {!game.isWin && game.lvl > 0 && (
                      <span>
                        {' '}
                        in {game.branch}:{game.lvl}
                      </span>
                    )}
                    {game.uniqueRunes > 0 && (
                      <span className="text-special">
                        {' '}
                        {game.isWin ? 'and' : 'with'} {game.uniqueRunes}{' '}
                        {pluralize('rune', game.uniqueRunes)}
                      </span>
                    )}
                    {game.gems > 0 && (
                      <span className="text-special">
                        {' '}
                        {game.uniqueRunes === 0 ? 'with' : 'and'} {game.gems}{' '}
                        {pluralize('gem', game.gems)}
                      </span>
                    )}
                    {(game.uniqueRunes > 0 || game.gems > 0) && '!'}
                  </div>
                  <div className="text-muted-foreground flex flex-wrap gap-x-2 text-xs">
                    <span>XL:{game.xl}</span>
                    <span>{formatNumber(game.turns)} turns</span>
                    <span>{formatDuration(game.duration)}</span>
                    <span>{date(game.endAt).utc().format('DD MMM YYYY')}</span>
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end justify-between">
                  <span className="font-mono font-medium">
                    {kind === 'DURATION'
                      ? formatDuration(entry.duration)
                      : kind === 'TURN_COUNT'
                        ? `${formatNumber(entry.turns)} turns`
                        : formatNumber(entry.score)}
                  </span>
                  {game.server && (
                    <div className="text-muted-foreground flex items-center gap-1 text-xs">
                      <a
                        target="_blank"
                        rel="noopener noreferrer"
                        href={game.server.url}
                        title={game.server.name}
                        className="underline"
                      >
                        {game.server.abbreviation}
                      </a>
                      <a
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Morgue"
                        href={getMorgueUrl(game.server.morgueUrl, game)}
                        className="hover:text-foreground"
                      >
                        <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1 pt-4">
          {page > 2 && (
            <Link
              prefetch={false}
              href={paginationQuery(1)}
              className="hover:bg-surface-hover rounded px-2 py-1 text-sm"
            >
              <ChevronDoubleLeftIcon className="h-4 w-4" />
            </Link>
          )}
          {page > 1 && (
            <Link
              prefetch={false}
              href={paginationQuery(page - 1)}
              className="hover:bg-surface-hover rounded px-2 py-1 text-sm"
            >
              ← Prev
            </Link>
          )}
          <span className="text-muted-foreground px-2 text-sm">
            {page} / {totalPages}
          </span>
          {page < totalPages && (
            <Link
              prefetch={false}
              href={paginationQuery(page + 1)}
              className="hover:bg-surface-hover rounded px-2 py-1 text-sm"
            >
              Next →
            </Link>
          )}
          {page < totalPages - 1 && (
            <Link
              prefetch={false}
              href={paginationQuery(totalPages)}
              className="hover:bg-surface-hover rounded px-2 py-1 text-sm"
            >
              <ChevronDoubleRightIcon className="h-4 w-4" />
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
