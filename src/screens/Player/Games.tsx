import clsx from 'clsx';
import { last, throttle } from 'lodash-es';
import { useState, useEffect } from 'react';
import { addS, date } from '@utils';
import { api } from '@api';
import { Game, Player } from '@types';
import externalLinkSvg from '@external.svg';
import refreshSvg from '@refresh.svg';
import { Props } from './index';

export const Games = (props: Props) => {
  const [games, setGames] = useState(props.lastGames);
  const [isLoading, setIsLoading] = useState(false);
  const [showUp, setShowUp] = useState(false);

  const hasMore = props.stats.total.games > games.length;

  useEffect(() => {
    const listener = throttle(() => {
      setShowUp(window.scrollY > window.innerHeight * 2);
    }, 100);

    document.addEventListener('scroll', listener);

    return () => document.removeEventListener('scroll', listener);
  }, []);

  return (
    <section className="space-y-1 relative 4">
      <h2 className="font-bold">
        Recent games ({games.length}G/
        {games.filter((g) => g.isWin).length}W):
      </h2>
      {showUp && (
        <button
          className="w-full sticky top-0 py-4 bg-white/80"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          Return to top
        </button>
      )}
      <ul className="space-y-2">
        {games.map((game) => {
          const duration = date.duration(game.duration, 'seconds');

          return (
            <li
              key={game.id}
              className={clsx(
                'py-1 px-2 border rounded border-gray-200 text-sm',
                game.isWin && 'border-l-green-500 border-l-2',
              )}
            >
              <div className="font-medium">
                {game.server && (
                  <a
                    className="float-right w-5 h-5 bg-no-repeat bg-center"
                    target="_blank"
                    href={`${game.server.morgueUrl}/${props.player.name}/${getMorgueUrl(
                      game,
                      props.player,
                    )}`}
                    rel="noopener noreferrer"
                    title="Morgue"
                    style={{
                      backgroundImage: `url(${externalLinkSvg.src})`,
                    }}
                  />
                )}
                {game.race} {game.class} <span className="font-light">the {game.title}</span>
              </div>
              <div>XL:{game.xl}</div>
              <div>
                <span className={clsx(game.isWin ? 'text-green-500' : 'text-red-500')}>
                  {game.endMessage}
                </span>{' '}
                {!game.isWin && game.lvl > 0 && (
                  <span>
                    in {game.branch}:{game.lvl}{' '}
                  </span>
                )}
                {game.uniqueRunes > 0 && (
                  <span className="text-indigo-600">
                    {game.isWin ? 'and' : 'with'} {game.uniqueRunes}{' '}
                    {addS('rune', game.uniqueRunes)}!
                  </span>
                )}
              </div>
              <div className="font-light">
                {game.god ? (
                  <>
                    Was {getPietyLevel(game.piety)} of{' '}
                    <span className="font-normal">{game.god}</span>
                  </>
                ) : (
                  'Was an Unbeliever'
                )}
              </div>
              <div className="pt-1 text-gray-400 text-xs flex justify-between">
                <div>
                  {formatNumber(game.score)} score points, {formatNumber(game.turns)} turns, lasted
                  for{' '}
                  {duration.format('D') !== '0' && (
                    <>
                      <span>{duration.format('D')} day</span> and{' '}
                    </>
                  )}
                  {duration.format('HH:mm:ss')}
                </div>
                {game.server && (
                  <a
                    target="_blank"
                    href={game.server.url}
                    rel="noopener noreferrer"
                    className="underline"
                  >
                    {game.server.abbreviation}
                  </a>
                )}
              </div>
              <div className="flex pt-0.5 justify-between text-gray-400 text-xs">
                <div>
                  {date(game.endAt).fromNow()},{' '}
                  {date(game.endAt).format('DD MMM YYYY [at] HH:mm:ss')}
                </div>
                <div>v{game.version}</div>
              </div>
            </li>
          );
        })}
      </ul>
      {hasMore && (
        <div className="flex justify-center items-center py-8">
          <button
            className="flex justify-center items-center space-x-1"
            disabled={isLoading}
            onClick={() => {
              setIsLoading(true);

              api
                .get<{ data: Game[] }>('/games', {
                  params: {
                    player: props.player.name,
                    after: last(games)?.id,
                  },
                })
                .then((res) => {
                  setGames([...games, ...res.data.data]);
                })
                .catch((e) => {
                  alert('Error while loading games');

                  throw e;
                })
                .finally(() => {
                  setIsLoading(false);
                });
            }}
          >
            <span>Load more</span>
            {isLoading && (
              <span
                className="w-5 h-5 animate-spin"
                style={{ backgroundImage: `url(${refreshSvg.src})` }}
              />
            )}
          </button>
        </div>
      )}
    </section>
  );
};

const formatNumber = (n: number, options?: Intl.NumberFormatOptions) => {
  return n.toLocaleString('en-EN', options);
};

const breakpoints = [30, 50, 75, 100, 120, 160];
const ranks = ['an Initiate', 'a Follower', 'a Believer', 'a Priest', 'an Elder', 'a High Priest'];
const getPietyLevel = (piety: number | null) => {
  if (!piety) {
    return last(ranks);
  }

  for (let i = 0; i < breakpoints.length; i++) {
    if (piety < breakpoints[i]) {
      return ranks[i];
    }
  }

  return 'the Champion';
};

const getMorgueUrl = (game: Game, player: Player) => {
  return `morgue-${player.name}-${date(game.endAt).utc().format('YYYYMMDD-HHmmss')}.txt`;
};
