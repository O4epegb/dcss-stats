import { map } from 'lodash-es'
import { GameTooltip } from '~/components/GameTooltip'
import { useSlicedList } from '~/hooks/useSlicedList'
import { pluralize, trackEvent } from '~/utils'
import { usePlayerPageContext } from './context'

export const Titles = () => {
  const { titlesCount, player } = usePlayerPageContext()
  const titles = map(titlesCount, (count, name) => ({ name, count }))
  const { items, showAll, hasMore, extraItemsCount, toggleShowAll } = useSlicedList(titles, 10)

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
            <button
              className="px-1 py-0.5 text-sm text-blue-400 hover:underline"
              onClick={() => {
                toggleShowAll()
                trackEvent('show titles')
              }}
            >
              {showAll ? 'Show fewer' : `Show ${extraItemsCount} more`}
            </button>
          </li>
        )}
      </ul>
    </section>
  )
}
