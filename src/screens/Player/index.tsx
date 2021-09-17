import clsx from 'clsx';
import { useMemo, useState, useEffect, Fragment } from 'react';
import { PlayerInfoResponse } from '@types';
import { addS } from '@utils';
import { canUseDOM } from '@constants';
import { useSlicedList } from '@hooks/useSlicedList';
import { Logo } from '@components/Logo';
import { WinrateStats } from '@components/WinrateStats';
import { Tooltip } from '@components/Tooltip';
import { Matrix } from './Matrix';
import { Games } from './Games';
import { Stats } from './Stats';
import { addToFavorite, getFavorites, getSummary, removeFromFavorite } from './utils';
import { Streaks } from './Streaks';

export type Props = PlayerInfoResponse;

declare global {
  interface Window {
    splitbee?: {
      track: (type: string, data?: Record<string, string>) => void;
    };
  }
}

export const Player = (props: Props) => {
  const { titles, player, races, classes, matrix, gods } = props;
  const [isFavorite, setIsFavorite] = useState(false);
  const { items, showAll, hasMore, extraItemsCount, toggleShowAll } = useSlicedList(titles, 10);
  const { stats } = props;

  const summary = useMemo(() => getSummary(matrix, races, classes, gods), [matrix]);
  const {
    trunkClasses,
    trunkRaces,
    wonRaces,
    wonClasses,
    wonGods,
    notWonClasses,
    notWonGods,
    notWonRaces,
    allActualClasses,
    allActualRaces,
  } = summary;

  const isGreat = wonRaces.length === trunkRaces.length;
  const isGreater = wonClasses.length === trunkClasses.length;
  const isGreatest = isGreat && isGreater;
  const isPolytheist = wonGods.length === gods.length;

  useEffect(() => {
    setIsFavorite(getFavorites().split(',').indexOf(player.name) !== -1);
  }, []);

  return (
    <div className="container mx-auto px-4 grid xl:grid-cols-3 gap-4">
      <div className="min-w-0">
        <header className="pt-4 pb-2">
          <Logo />
        </header>
        <div className="space-y-2">
          <section className="flex flex-wrap gap-x-2 gap-y-1 items-center">
            <h2 className="text-3xl font-bold">{player.name}</h2>
            <Tooltip
              hideOnClick={false}
              content={isFavorite ? 'Remove from favorite' : 'Add to favorite'}
            >
              <button
                className={clsx(
                  'flex items-center justify-center w-6 h-6 hover:bg-gray-100 rounded transition-colors',
                  isFavorite ? 'text-yellow-400' : 'text-gray-300',
                )}
                onClick={() => {
                  const newIsFavorite = !isFavorite;

                  if (newIsFavorite) {
                    addToFavorite(player.name);
                  } else {
                    removeFromFavorite(player.name);
                  }

                  window.splitbee?.track(newIsFavorite ? 'Add favorite' : 'Remove favorite', {
                    name: player.name,
                  });

                  setIsFavorite(newIsFavorite);
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </button>
            </Tooltip>
            <div className="flex flex-wrap gap-2 text-sm">
              {isGreatest ? (
                <Tooltip content="Has won with all races and all classes">
                  <div className="rounded py-0.5 px-1 bg-yellow-300 ring-inset ring-2 ring-yellow-600">
                    Greatest Player
                  </div>
                </Tooltip>
              ) : (
                <>
                  {isGreat && (
                    <Tooltip content="Has won with all races">
                      <div className="rounded py-0.5 px-1 bg-yellow-300">Great Player</div>
                    </Tooltip>
                  )}
                  {isGreater && (
                    <Tooltip content="Has won with all classes">
                      <div className="rounded py-0.5 px-1 bg-yellow-300">Greater Player</div>
                    </Tooltip>
                  )}
                </>
              )}
              {isPolytheist && (
                <Tooltip content="Has won with all gods">
                  <div className="rounded py-0.5 px-1 bg-purple-300">Polytheist</div>
                </Tooltip>
              )}
            </div>
          </section>

          <section>
            <WinrateStats wins={stats.total.wins} games={stats.total.games} />
          </section>

          {(!isPolytheist || !isGreat || !isGreater) && (
            <section className="flex flex-row flex-wrap gap-2 items-start text-xs">
              {!isGreat && (
                <Badge
                  title="Great Player"
                  allItems={trunkRaces}
                  playerItems={wonRaces}
                  leftToWinWith={notWonRaces}
                />
              )}
              {!isGreater && (
                <Badge
                  title="Greater Player"
                  allItems={trunkClasses}
                  playerItems={wonClasses}
                  leftToWinWith={notWonClasses}
                />
              )}
              {!isPolytheist && (
                <Badge
                  title="Polytheist"
                  allItems={gods}
                  playerItems={wonGods}
                  leftToWinWith={notWonGods}
                />
              )}
            </section>
          )}

          <Stats {...props} />

          {items.length > 0 && (
            <section className="space-y-1">
              <h2 className="font-bold">
                Collected {titles.length} {addS('title', titles.length)}:
              </h2>
              <ul className="flex flex-wrap gap-1 text-sm">
                {items.map((title) => (
                  <li key={title} className="bg-gray-600 text-white rounded px-1 py-0.5">
                    {title}
                  </li>
                ))}
                {hasMore && (
                  <li>
                    <button
                      className="text-blue-400 text-sm px-1 py-0.5 hover:underline"
                      onClick={toggleShowAll}
                    >
                      {showAll ? 'Show fewer' : `Show ${extraItemsCount} more`}
                    </button>
                  </li>
                )}
              </ul>
            </section>
          )}

          <Streaks {...props} />
          <Games {...props} allActualRaces={allActualRaces} allActualClasses={allActualClasses} />
        </div>
      </div>
      <div className="xl:col-span-2 min-w-0">
        <Matrix {...props} summary={summary} />
      </div>
    </div>
  );
};

const Badge = ({
  playerItems,
  allItems,
  leftToWinWith,
  title,
}: {
  playerItems: unknown[];
  allItems: unknown[];
  leftToWinWith: Array<{ name: string }>;
  title: string;
}) => {
  return (
    <Tooltip
      interactive
      appendTo={canUseDOM ? document.body : 'parent'}
      content={
        <div className="space-y-2">
          <div>Need to win with:</div>
          <ul>
            {leftToWinWith.map((item) => (
              <li key={item.name}>{item.name}</li>
            ))}
          </ul>
        </div>
      }
    >
      <div className="rounded py-0.5 px-1 relative overflow-hidden bg-gray-100">
        <div
          className="bg-gray-200 absolute top-0 left-0 bottom-0"
          style={{
            width: `${(playerItems.length / allItems.length) * 100}%`,
          }}
        />
        <span className="z-[1] relative">
          {title} {playerItems.length} of {allItems.length}
        </span>
      </div>
    </Tooltip>
  );
};
