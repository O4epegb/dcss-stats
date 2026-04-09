import { ChevronDoubleLeftIcon, ChevronDoubleRightIcon } from '@heroicons/react/24/outline'
import { Metadata } from 'next'
import Link from 'next/link'
import { fetchApi } from '~/api/server'
import { sharedOGMetadata } from '~/app/shared-metadata'
import { defaultMetaTitle } from '~/constants'
import { HighscoresRecordsResponse } from '~/types'
import { cn, formatDuration, formatNumber } from '~/utils'

const title = `Most High Scores | ${defaultMetaTitle}`

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
    { value: undefined, label: 'Combined runes' },
    { value: 'TIER_1', label: '3 Runes' },
    { value: 'TIER_2', label: '4+ Runes' },
  ],
  TURN_COUNT: [
    { value: undefined, label: 'Combined runes' },
    { value: 'TIER_1', label: '3-14 Runes' },
    { value: 'TIER_2', label: '15 Runes' },
  ],
  DURATION: [
    { value: undefined, label: 'Combined runes' },
    { value: 'TIER_1', label: '3-14 Runes' },
    { value: 'TIER_2', label: '15 Runes' },
  ],
}

const runeTierDisplayLabels: Record<string, string> = {
  TIER_1: '3 rune',
  TIER_2: '4+ rune',
}

const multiRuneTierDisplayLabels: Record<string, string> = {
  TIER_1: '3-14 rune',
  TIER_2: '15 rune',
}

const kindDisplayLabels: Record<string, Record<string, string>> = {
  HIGHSCORE: runeTierDisplayLabels,
  TURN_COUNT: multiRuneTierDisplayLabels,
  DURATION: multiRuneTierDisplayLabels,
}

function formatValue(kind: string | undefined, value: number) {
  if (kind === 'DURATION') return formatDuration(value)
  if (kind === 'TURN_COUNT') return formatNumber(value) + ' turns'
  return formatNumber(value)
}

const PER_PAGE = 25

export default async function RecordsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const page = Number(params.page) || 1
  const skip = (page - 1) * PER_PAGE
  const search = params.search ? String(params.search) : ''
  const kind = (params.kind as string) ?? 'HIGHSCORE'
  const runeTier = params.runeTier as string | undefined

  const fetchParams = new URLSearchParams()
  fetchParams.append('kind', kind)
  if (runeTier) {
    fetchParams.append('runeTier', runeTier)
  }
  fetchParams.append('skip', String(skip))
  fetchParams.append('take', String(PER_PAGE))
  if (search) {
    fetchParams.append('search', search)
  }

  const response: HighscoresRecordsResponse = await fetchApi(
    '/highscores/records?' + fetchParams.toString(),
  ).then((r) => r.json())

  const totalPages = Math.ceil(response.total / PER_PAGE)

  const paginationQuery = (pageNum: number) => ({
    pathname: '/highscores/first' as const,
    query: {
      kind: params.kind,
      runeTier: params.runeTier,
      search: params.search,
      page: pageNum > 1 ? String(pageNum) : undefined,
    },
  })

  const runeTiers = runeTiersByKind[kind] ?? runeTiersByKind.HIGHSCORE

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Players ranked by number of #1 placements on any character and rune tier.
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex gap-1">
          {kinds.map((k) => (
            <Link
              key={k.label}
              prefetch={false}
              href={{
                pathname: '/highscores/first',
                query: {
                  kind: k.value,
                  runeTier: params.runeTier,
                  search: params.search,
                },
              }}
              className={cn(
                'rounded px-2 py-0.5 text-sm',
                kind === k.value
                  ? 'bg-gray-200 font-medium dark:bg-gray-700'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-800',
              )}
            >
              {k.label}
            </Link>
          ))}
        </div>
        {runeTiers.length > 0 && (
          <>
            <span className="text-gray-300 dark:text-gray-600">|</span>
            <div className="flex gap-1">
              {runeTiers.map((r) => (
                <Link
                  key={r.label}
                  prefetch={false}
                  href={{
                    pathname: '/highscores/first',
                    query: {
                      kind: params.kind,
                      runeTier: r.value,
                      search: params.search,
                    },
                  }}
                  className={cn(
                    'rounded px-2 py-0.5 text-sm',
                    params.runeTier === r.value || (!params.runeTier && !r.value)
                      ? 'bg-gray-200 font-medium dark:bg-gray-700'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-800',
                  )}
                >
                  {r.label}
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
      <form action="/highscores/first" method="get">
        <input type="hidden" name="kind" value={kind} />
        {runeTier && <input type="hidden" name="runeTier" value={runeTier} />}
        <input
          type="text"
          name="search"
          defaultValue={search}
          placeholder="Search player..."
          className="w-full rounded-sm border border-gray-200 bg-white px-3 py-1.5 text-sm text-black placeholder-gray-400 dark:border-gray-300 dark:bg-zinc-900 dark:text-white dark:placeholder-gray-500"
        />
      </form>

      {response.data.length === 0 ? (
        <div className="py-4 text-center text-sm text-gray-500 dark:text-gray-400">
          No players found.
        </div>
      ) : (
        <div className="divide-y divide-gray-200 overflow-hidden rounded-sm dark:divide-gray-700">
          {response.data.map((entry) => (
            <div
              key={entry.playerId}
              className="bg-white py-2 text-sm text-black dark:bg-zinc-900 dark:text-white"
            >
              <div className="flex items-center gap-3">
                <span className="w-8 shrink-0 text-right font-mono text-gray-500 dark:text-gray-400">
                  #{entry.rank}
                </span>
                <Link
                  prefetch={false}
                  href={`/players/${entry.playerName}`}
                  className="font-medium hover:underline"
                >
                  {entry.playerName}
                </Link>
                <div className="ml-auto font-mono font-bold">{entry.records}</div>
              </div>
              {entry.combos.length > 0 && (
                <div className="mt-1 ml-11 flex flex-wrap gap-1">
                  {entry.combos.map((combo, i) => {
                    const tierLabels = kindDisplayLabels[kind] ?? kindDisplayLabels.HIGHSCORE
                    const tierLabel = combo.runeTier
                      ? (tierLabels[combo.runeTier] ?? combo.runeTier)
                      : ''

                    return (
                      <span
                        key={`${combo.char}-${combo.runeTier}-${i}`}
                        className="text-2xs rounded bg-gray-100 px-1.5 py-0.5 font-mono font-medium md:text-xs dark:bg-zinc-800"
                        title={tierLabel ? `${combo.char} (${tierLabel})` : combo.char}
                      >
                        {combo.char}
                        <span className="ml-1 text-gray-500 dark:text-gray-400">
                          {formatValue(kind, combo.value)}
                        </span>
                      </span>
                    )
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1 pt-2">
          {page > 2 && (
            <Link
              prefetch={false}
              href={paginationQuery(1)}
              className="rounded px-2 py-1 text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <ChevronDoubleLeftIcon className="h-4 w-4" />
            </Link>
          )}
          {page > 1 && (
            <Link
              prefetch={false}
              href={paginationQuery(page - 1)}
              className="rounded px-2 py-1 text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              ← Prev
            </Link>
          )}
          <span className="px-2 text-sm text-gray-500 dark:text-gray-400">
            {page} / {totalPages}
          </span>
          {page < totalPages && (
            <Link
              prefetch={false}
              href={paginationQuery(page + 1)}
              className="rounded px-2 py-1 text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              Next →
            </Link>
          )}
          {page < totalPages - 1 && (
            <Link
              prefetch={false}
              href={paginationQuery(totalPages)}
              className="rounded px-2 py-1 text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <ChevronDoubleRightIcon className="h-4 w-4" />
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
