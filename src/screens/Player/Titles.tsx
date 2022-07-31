import { pluralize, trackEvent } from '@utils';
import { useSlicedList } from '@hooks/useSlicedList';
import { GameTooltip } from '@components/GameTooltip';
import { usePlayerPageContext } from './context';

export const Titles = () => {
  const { titles, player } = usePlayerPageContext();
  const { items, showAll, hasMore, extraItemsCount, toggleShowAll } = useSlicedList(titles, 10);

  if (items.length === 0) {
    return null;
  }

  return (
    <section className="space-y-1">
      <h2 className="font-bold">
        Collected {titles.length} {pluralize('title', titles.length)}:
      </h2>

      <ul className="flex flex-wrap gap-1 text-sm">
        {items.map((title) => (
          <li key={title}>
            <GameTooltip isWin title={title} player={player.name}>
              <div className="rounded bg-gray-600 px-1 py-0.5 text-white">{title}</div>
            </GameTooltip>
          </li>
        ))}
        {hasMore && (
          <li>
            <button
              className="px-1 py-0.5 text-sm text-blue-400 hover:underline"
              onClick={() => {
                toggleShowAll();
                trackEvent('show titles');
              }}
            >
              {showAll ? 'Show fewer' : `Show ${extraItemsCount} more`}
            </button>
          </li>
        )}
      </ul>
    </section>
  );
};
