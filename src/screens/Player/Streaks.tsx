import { Fragment, useState } from 'react';
import { last, first, orderBy } from 'lodash-es';
import { Game } from '@types';
import { api } from '@api';
import { addS, date, formatNumber } from '@utils';
import refreshSvg from '@refresh.svg';
import { List } from './Stats';
import { Props } from './index';

type StreakGame = Pick<Game, 'id' | 'isWin' | 'endAt' | 'char'>;

export const Streaks = ({ streaks, player }: Props) => {
  const [streakGroups, setStreakGroups] = useState<Array<StreakGame[]>>([]);
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

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
                .get<{ streaks: { streaks: Array<StreakGame[]> } }>(`/players/${player.id}/streaks`)
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
      {isLoading && (
        <div className="flex items-center justify-center">
          <span
            className="w-5 h-5 animate-spin"
            style={{ backgroundImage: `url(${refreshSvg.src})` }}
          />
        </div>
      )}
      {isVisible && (
        <div className="space-y-2">
          {orderBy(streakGroups, (streak) => streak.filter((x) => x.isWin).length, 'desc').map(
            (streak, index) => {
              const isActive = streak.every((x) => x.isWin);
              const lastGame = last(streak);
              const firstGame = first(streak);
              const breaker = lastGame && !lastGame.isWin;
              const streakLength = isActive ? streak.length : streak.length - 1;

              return (
                <div
                  key={index}
                  className="text-sm py-1 px-2 border rounded border-gray-200 bg-white text-black"
                >
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
                  {breaker && lastGame && (
                    <div>
                      <span className="font-light">Streak breaker:</span> {lastGame.char}
                    </div>
                  )}
                  {firstGame && (
                    <div className="text-gray-400 text-xs pt-0.5">
                      From <span>{date(firstGame.endAt).format('DD MMM YYYY, HH:mm:ss')}</span>{' '}
                      {breaker && lastGame && (
                        <>
                          to <span>{date(lastGame.endAt).format('DD MMM YYYY, HH:mm:ss')}</span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            },
          )}
        </div>
      )}
    </section>
  );
};
