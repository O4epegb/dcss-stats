import clsx from 'clsx';
import { useMemo, useState, useEffect } from 'react';
import { addS, formatNumber, trackEvent } from '@utils';
import { canUseDOM } from '@constants';
import { Logo } from '@components/Logo';
import { WinrateStats } from '@components/WinrateStats';
import { Tooltip } from '@components/Tooltip';
import { Matrix } from './Matrix';
import { Games } from './Games';
import { Stats } from './Stats';
import { addToFavorite, getFavorites, getSummary, removeFromFavorite } from './utils';
import { Streaks } from './Streaks';
import { usePlayerPageContext } from './context';
import { Titles } from './Titles';

export const Player = () => {
  const { player, races, classes, matrix, gods, stats, gamesToFirstWin } = usePlayerPageContext();
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    setIsFavorite(getFavorites().split(',').indexOf(player.name) !== -1);
  }, []);

  const summary = useMemo(
    () => getSummary(matrix, races, classes, gods, gamesToFirstWin),
    [matrix],
  );
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

  return (
    <div className="container mx-auto grid gap-4 px-4 xl:grid-cols-3">
      <div className="min-w-0">
        <header className="pt-4 pb-2">
          <Logo />
        </header>
        <div className="space-y-2">
          <section className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <h2 className="text-3xl font-bold">{player.name}</h2>
            <Tooltip
              hideOnClick={false}
              content={isFavorite ? 'Remove from favorite' : 'Add to favorite'}
            >
              <button
                className={clsx(
                  'flex h-6 w-6 items-center justify-center rounded transition-colors hover:bg-gray-100',
                  isFavorite ? 'text-amber-400' : 'text-gray-300',
                )}
                onClick={() => {
                  const newIsFavorite = !isFavorite;

                  if (newIsFavorite) {
                    addToFavorite(player.name);
                  } else {
                    removeFromFavorite(player.name);
                  }

                  trackEvent(newIsFavorite ? 'Add favorite' : 'Remove favorite', {
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
                  <div className="rounded bg-amber-300 py-0.5 px-1 ring-2 ring-inset ring-amber-600">
                    Greatest Player
                  </div>
                </Tooltip>
              ) : (
                <>
                  {isGreat && (
                    <Tooltip content="Has won with all races">
                      <div className="rounded bg-amber-300 py-0.5 px-1">Great Player</div>
                    </Tooltip>
                  )}
                  {isGreater && (
                    <Tooltip content="Has won with all classes">
                      <div className="rounded bg-amber-300 py-0.5 px-1">Greater Player</div>
                    </Tooltip>
                  )}
                </>
              )}
              {isPolytheist && (
                <Tooltip content="Has won with all gods">
                  <div className="rounded bg-violet-300 py-0.5 px-1">Polytheist</div>
                </Tooltip>
              )}
            </div>
          </section>

          <section>
            <WinrateStats wins={stats.total.wins} games={stats.total.games} />
            <div className="text-xs">
              {stats.lastMonth.total} {addS('game', stats.lastMonth.total)} and{' '}
              {stats.lastMonth.wins} {addS('win', stats.lastMonth.wins)}{' '}
              {stats.lastMonth.wins > 0 && (
                <>
                  (
                  {formatNumber((stats.lastMonth.wins / stats.lastMonth.total || 1) * 100, {
                    maximumFractionDigits: 2,
                  })}
                  %){' '}
                </>
              )}
              in the last 30 days
            </div>
          </section>

          {!(isGreat && isGreater && isPolytheist) && (
            <section className="flex flex-row flex-wrap items-start gap-2 text-xs">
              {!isGreat && (
                <Badge
                  title="Great Player"
                  total={trunkRaces.length}
                  completed={wonRaces.length}
                  leftToWinWith={notWonRaces}
                />
              )}
              {!isGreater && (
                <Badge
                  title="Greater Player"
                  total={trunkClasses.length}
                  completed={wonClasses.length}
                  leftToWinWith={notWonClasses}
                />
              )}
              {!isPolytheist && (
                <Badge
                  title="Polytheist"
                  total={gods.length}
                  completed={wonGods.length}
                  leftToWinWith={notWonGods}
                />
              )}
            </section>
          )}

          <Stats summary={summary} />
          <Titles />
          <Streaks />
          <Games allActualRaces={allActualRaces} allActualClasses={allActualClasses} />
        </div>
      </div>
      <div className="min-w-0 xl:col-span-2">
        <Matrix summary={summary} />
      </div>
    </div>
  );
};

const Badge = ({
  completed,
  total,
  leftToWinWith,
  title,
}: {
  completed: number;
  total: number;
  leftToWinWith?: Array<{ name: string }>;
  title: string;
}) => {
  return (
    <Tooltip
      interactive
      disabled={!leftToWinWith}
      appendTo={canUseDOM ? document.body : 'parent'}
      content={
        <div className="space-y-2">
          <div>Need to win with:</div>
          {leftToWinWith && (
            <ul>
              {leftToWinWith.map((item) => (
                <li key={item.name}>{item.name}</li>
              ))}
            </ul>
          )}
        </div>
      }
    >
      <div className="relative overflow-hidden rounded bg-gray-100 py-0.5 px-1">
        <div
          className="absolute top-0 left-0 bottom-0 bg-gray-200"
          style={{
            width: `${(completed / total) * 100}%`,
          }}
        />
        <span className="relative z-[1]">
          {title} {completed} of {total}
        </span>
      </div>
    </Tooltip>
  );
};
