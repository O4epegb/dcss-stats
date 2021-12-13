import { Fragment, useState } from 'react';
import { last, first, orderBy } from 'lodash-es';
import clsx from 'clsx';
import { Game } from '@types';
import { api } from '@api';
import { addS, date, formatNumber } from '@utils';
import { Loader } from '@components/Loader';
import { List } from './Stats';
import { usePlayerPageContext } from './context';

type StreakGame = Pick<Game, 'id' | 'isWin' | 'endAt' | 'char'>;
type StreakGroups = Array<StreakGame[]>;

export const Streaks = () => {
  const { streaks, player, lastGames } = usePlayerPageContext();
  const [streakGroups, setStreakGroups] = useState<StreakGroups>([]);
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const isOnStreak = lastGames[0]?.isWin && lastGames[1]?.isWin;

  return (
    <section className="space-y-1">
      <header className="flex justify-between items-center">
        <h2 className="font-bold">
          {streaks.total > 0 ? (
            <>
              Has {streaks.total} {addS('streak', streaks.total)} of wins:
            </>
          ) : (
            'Has no streaks of wins yet'
          )}
        </h2>
        {isOnStreak && <div className="text-sm text-emerald-500">On streak right now!</div>}
      </header>
      {streaks.total > 0 && (
        <div className="flex items-center gap-x-4 gap-y-2 text-sm whitespace-nowrap">
          <List items={[['Best', `${streaks.best} ${addS('win', streaks.best)}`]]} />
          <List
            items={[
              [
                'Average',
                `${formatNumber(streaks.average, { maximumFractionDigits: 1 })} ${addS(
                  'win',
                  streaks.average,
                )}`,
              ],
            ]}
          />
          <button
            disabled={isLoading}
            className="text-blue-400 text-sm py-0.5 hover:underline ml-auto"
            onClick={() => {
              if (streakGroups.length > 0) {
                setIsVisible((state) => !state);

                return;
              }

              setIsLoading(true);

              api
                .get<{ streaks: { streaks: StreakGroups } }>(`/players/${player.id}/streaks`)
                .then((res) => {
                  setStreakGroups(res.data.streaks.streaks);
                  setIsVisible(true);
                })
                .catch((e) => {
                  alert('Error while loading streaks');

                  throw e;
                })
                .finally(() => {
                  setIsLoading(false);
                });
            }}
          >
            {isVisible ? 'Hide' : 'Show'} streaks
          </button>
        </div>
      )}
      {isLoading && <Loader />}
      {isVisible && (
        <div className="space-y-2">
          {orderBy(
            streakGroups,
            [(streak) => last(streak)?.isWin, (streak) => streak.filter((x) => x.isWin).length],
            ['desc', 'desc'],
          ).map((streak, index) => {
            const isActive = streak.every((x) => x.isWin);
            const firstGame = first(streak);
            const lastGame = last(streak);
            const streakLength = isActive ? streak.length : streak.length - 1;

            return (
              <div
                key={index}
                className={clsx(
                  'text-sm py-1 px-2 border rounded border-gray-200 bg-white text-black',
                  isActive && 'border-l-2 border-l-emerald-500',
                )}
              >
                {isActive && <div className="text-emerald-500">Active streak</div>}
                <div>
                  <span className="font-medium">{streakLength} wins:</span>{' '}
                  <span>
                    {streak
                      .filter((game) => game.isWin)
                      .map((game, index) => (
                        <Fragment key={game.id}>
                          {index !== 0 && ', '}
                          {game.char}
                        </Fragment>
                      ))}
                  </span>
                </div>
                {!isActive && lastGame && (
                  <div>
                    <span className="font-light">Streak breaker:</span> {lastGame.char}
                  </div>
                )}
                {firstGame && (
                  <div className="text-gray-400 text-xs pt-0.5">
                    From <span>{date(firstGame.endAt).format('DD MMM YYYY, HH:mm:ss')}</span>{' '}
                    {!isActive && lastGame && (
                      <>
                        to <span>{date(lastGame.endAt).format('DD MMM YYYY, HH:mm:ss')}</span>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
