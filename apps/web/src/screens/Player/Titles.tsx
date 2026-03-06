import { map, orderBy } from 'lodash-es'
import { useMemo, useState } from 'react'
import useSWRImmutable from 'swr/immutable'
import { api } from '~/api'
import { GameTooltip } from '~/components/GameTooltip'
import { Dialog, DialogContent, DialogTrigger } from '~/components/ui/Dialog'
import { Game } from '~/types'
import { cn, pluralize } from '~/utils'
import { usePlayerPageContext } from './context'

export const Titles = () => {
  const { titlesCount, player } = usePlayerPageContext()
  const [wasOpened, setWasOpened] = useState(false)
  const titles = map(titlesCount, (count, name) => ({ name, count }))
  const items = titles.slice(0, 10)
  const hasMore = titles.length > items.length

  if (items.length === 0) {
    return null
  }

  return (
    <section className="space-y-1">
      <h2 className="font-bold">
        Collected {titles.length} {pluralize('title', titles.length)}:
      </h2>

      <ul className="flex flex-wrap gap-1 text-sm">
        {items.map((title) => (
          <li key={title.name}>
            <GameTooltip isWin title={title.name} player={player.name}>
              <div className="rounded bg-gray-600 px-1 py-0.5 text-white">
                {title.name}
                {title.count > 1 ? ` (${title.count})` : ''}
              </div>
            </GameTooltip>
          </li>
        ))}
        {hasMore && (
          <li>
            <Dialog
              onOpenChange={(open) => {
                if (open) {
                  setWasOpened(true)
                }
              }}
            >
              <DialogTrigger className="px-1 py-0.5 text-sm text-blue-400 hover:underline">
                Show all
              </DialogTrigger>
              <TitlesDialogContent wasOpened={wasOpened} titles={titles} player={player} />
            </Dialog>
          </li>
        )}
      </ul>
    </section>
  )
}

const TitlesDialogContent = ({
  wasOpened,
  titles,
  player,
}: {
  wasOpened: boolean
  player: { name: string }
  titles: { name: string; count: number }[]
}) => {
  const [view, setView] = useState<ViewId>('titles')

  const { data } = useSWRImmutable(wasOpened ? `/players/${player.name}/titles` : null, (url) =>
    api.get<{ games: TitleGame[] }>(url).then((res) => res.data),
  )

  const rowsByView = useMemo(() => {
    const games = data?.games ?? []
    const breakdownRows = Object.entries(viewGroupers).reduce<
      Record<BreakdownViewId, BreakdownRow[]>
    >(
      (acc, [viewId, getLabel]) => {
        acc[viewId as BreakdownViewId] = aggregateRows(games, getLabel)
        return acc
      },
      {
        byClass: [],
        byRace: [],
        byGod: [],
        byCombo: [],
        byRunes: [],
      },
    )

    return {
      titles: [],
      ...breakdownRows,
    }
  }, [data])

  const currentRows = rowsByView[view]

  return (
    <DialogContent title="Collected titles" className="sm:w-[90vw] sm:max-w-6xl">
      <div className="space-y-3">
        <div className="flex flex-wrap gap-1.5 text-xs">
          {views.map((item) => (
            <button
              key={item.id}
              className={cn(
                'rounded border px-2 py-1 transition-colors',
                view === item.id
                  ? 'border-gray-700 bg-gray-700 text-white dark:border-zinc-200 dark:bg-zinc-200 dark:text-black'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-100 dark:border-zinc-700 dark:text-gray-200 dark:hover:bg-zinc-900',
              )}
              onClick={() => setView(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>

        {view === 'titles' ? (
          <ul className="flex flex-wrap gap-1 text-sm">
            {titles.map((title) => (
              <li key={title.name}>
                <GameTooltip isWin title={title.name} player={player.name}>
                  <div className="rounded bg-gray-600 px-1 py-0.5 text-white">
                    {title.name}
                    {title.count > 1 ? ` (${title.count})` : ''}
                  </div>
                </GameTooltip>
              </li>
            ))}
          </ul>
        ) : !data ? (
          <div className="text-sm text-gray-500">Loading title game breakdown...</div>
        ) : (
          <BreakdownTable view={view} rows={currentRows} />
        )}
      </div>
    </DialogContent>
  )
}

type ViewId = 'titles' | 'byClass' | 'byRace' | 'byGod' | 'byCombo' | 'byRunes'
type BreakdownViewId = Exclude<ViewId, 'titles'>
type SortBy = 'label' | 'games' | 'uniqueTitles'
type SortDirection = 'asc' | 'desc'

const views: { id: ViewId; label: string; header?: string }[] = [
  { id: 'titles', label: 'Titles', header: '' },
  { id: 'byClass', label: 'By class', header: 'Class' },
  { id: 'byRace', label: 'By race', header: 'Race' },
  { id: 'byCombo', label: 'By combo', header: 'Combo' },
  { id: 'byGod', label: 'By god', header: 'God' },
  { id: 'byRunes', label: 'By rune count', header: 'Runes' },
]

type TitleGame = Pick<
  Game,
  'id' | 'char' | 'normalizedClass' | 'normalizedRace' | 'god' | 'uniqueRunes' | 'title'
>

const viewGroupers: Record<BreakdownViewId, (game: TitleGame) => string> = {
  byClass: (game) => game.normalizedClass,
  byRace: (game) => game.normalizedRace,
  byGod: (game) => game.god || 'Atheist',
  byCombo: (game) => game.char,
  byRunes: (game) => `${game.uniqueRunes ?? 0} runes`,
}

type BreakdownRow = {
  label: string
  games: number
  gameIds: string[]
  uniqueTitles: number
  titles: {
    name: string
    count: number
    gameIds: string[]
  }[]
}

const aggregateRows = (
  games: TitleGame[],
  getLabel: (game: TitleGame) => string,
): BreakdownRow[] => {
  const grouped = new Map<string, TitleGame[]>()

  for (const game of games) {
    const label = getLabel(game)
    const existing = grouped.get(label)
    if (existing) {
      existing.push(game)
    } else {
      grouped.set(label, [game])
    }
  }

  return Array.from(grouped.entries())
    .map(([label, groupedGames]) => {
      const titles = new Map<string, TitleGame[]>()

      for (const game of groupedGames) {
        const existing = titles.get(game.title)
        if (existing) {
          existing.push(game)
        } else {
          titles.set(game.title, [game])
        }
      }

      return {
        label,
        games: groupedGames.length,
        gameIds: groupedGames.map((game) => game.id),
        uniqueTitles: titles.size,
        titles: Array.from(titles.entries())
          .map(([name, titleGames]) => ({
            name,
            count: titleGames.length,
            gameIds: titleGames.map((game) => game.id),
          }))
          .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name)),
      }
    })
    .sort(
      (a, b) =>
        b.games - a.games || b.uniqueTitles - a.uniqueTitles || a.label.localeCompare(b.label),
    )
}

const BreakdownTable = ({ view, rows }: { view: ViewId; rows: BreakdownRow[] }) => {
  const [sortBy, setSortBy] = useState<SortBy>('games')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

  const sortedRows = useMemo(() => {
    if (sortBy === 'label') {
      return orderBy(rows, ['label', 'games'], [sortDirection, 'desc'])
    }

    return orderBy(rows, [sortBy, 'label'], [sortDirection, 'asc'])
  }, [rows, sortBy, sortDirection])

  const toggleSort = (nextSortBy: SortBy) => {
    if (sortBy === nextSortBy) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))
      return
    }

    setSortBy(nextSortBy)
    setSortDirection(nextSortBy === 'label' ? 'asc' : 'desc')
  }

  const getSortIndicator = (column: SortBy) => {
    if (sortBy !== column) {
      return ''
    }

    return sortDirection === 'asc' ? ' ↑' : ' ↓'
  }

  if (rows.length === 0) {
    return <div className="text-sm text-gray-500">No title games found for this view.</div>
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-gray-200 dark:border-zinc-700">
            <th className="px-2 py-1 font-medium whitespace-nowrap">
              <button
                className="inline-flex items-center whitespace-nowrap hover:underline"
                onClick={() => toggleSort('label')}
              >
                {views.find((v) => v.id === view)?.header + getSortIndicator('label')}
              </button>
            </th>
            <th className="px-2 py-1 text-right font-medium whitespace-nowrap">
              <button
                className="inline-flex items-center whitespace-nowrap hover:underline"
                onClick={() => toggleSort('games')}
              >
                {'Total' + getSortIndicator('games')}
              </button>
            </th>
            <th className="px-2 py-1 text-right font-medium whitespace-nowrap">
              <button
                className="inline-flex items-center whitespace-nowrap hover:underline"
                onClick={() => toggleSort('uniqueTitles')}
              >
                {'Unique' + getSortIndicator('uniqueTitles')}
              </button>
            </th>
            <th className="px-2 py-1 font-medium">Titles</th>
          </tr>
        </thead>
        <tbody>
          {sortedRows.map((row, index) => (
            <tr
              key={row.label}
              className={cn(
                'border-b border-gray-100 align-top last:border-none dark:border-zinc-800',
                index % 2 === 1 && 'bg-gray-50/60 dark:bg-zinc-900/40',
                'hover:bg-gray-100/60 dark:hover:bg-zinc-900/70',
              )}
            >
              <td className="px-2 py-1 align-top whitespace-nowrap">{row.label}</td>
              <td className="px-2 py-1 text-right align-top tabular-nums">{row.games}</td>
              <td className="px-2 py-1 text-right align-top tabular-nums">{row.uniqueTitles}</td>
              <td className="px-2 py-1 align-top">
                <ul className="flex flex-wrap gap-1">
                  {row.titles.map((title) => (
                    <li key={title.name}>
                      {title.gameIds[0] && (
                        <GameTooltip id={title.gameIds[0]}>
                          <div className="rounded bg-gray-600 px-1 py-0.5 text-white">
                            {title.name}
                            {title.count > 1 ? ` (${title.count})` : ''}
                          </div>
                        </GameTooltip>
                      )}
                    </li>
                  ))}
                </ul>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
