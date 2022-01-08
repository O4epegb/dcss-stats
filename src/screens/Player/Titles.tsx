import { addS, trackEvent } from '@utils';
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
        Collected {titles.length} {addS('title', titles.length)}:
      </h2>

      <ul className="flex flex-wrap gap-1 text-sm">
        {items.map((title) => (
          <li key={title}>
            <GameTooltip isWin title={title} player={player.name}>
              <div className="bg-gray-600 text-white rounded px-1 py-0.5">{title}</div>
            </GameTooltip>
          </li>
        ))}
        {hasMore && (
          <li>
            <button
              className="text-blue-400 text-sm px-1 py-0.5 hover:underline"
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
