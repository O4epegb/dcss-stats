import clsx from 'clsx';
import { first, last, throttle } from 'lodash-es';
import { useState, useEffect } from 'react';
import { addS, date } from '@utils';
import { api } from '@api';
import { Class, Game, Player, Race } from '@types';
import externalLinkSvg from '@external.svg';
import refreshSvg from '@refresh.svg';
import { Props } from './index';

enum Filter {
  All = 'all',
  Wins = 'wins',
}

export const Games = ({
  lastGames,
  stats,
  player,
  allActualRaces,
  allActualClasses,
}: Props & { allActualRaces: Race[]; allActualClasses: Class[] }) => {
  const [games, setGames] = useState(lastGames);
  const [isLoading, setIsLoading] = useState(false);
  const [showUp, setShowUp] = useState(false);
  const [count, setCount] = useState(stats.total.games);
  const [filter, setFilter] = useState(() => ({
    isWin: Filter.All,
    race: Filter.All,
    class: Filter.All,
  }));

  const hasMore = count > games.length;

  const loadMore = () => {
    setIsLoading(true);
  };

  useEffect(() => {
    const listener = throttle(() => {
      setShowUp(window.scrollY > window.innerHeight * 2);
    }, 100);

    document.addEventListener('scroll', listener);

    return () => document.removeEventListener('scroll', listener);
  }, []);

  useEffect(() => {
    if (!isLoading) {
      return;
    }

    api
      .get<{ data: Game[]; count: number }>('/games', {
        params: {
          player: player.name,
          after: last(games)?.id,
          isWin: filter.isWin === Filter.Wins || undefined,
          race: filter.race === Filter.All ? undefined : filter.race,
          class: filter.class === Filter.All ? undefined : filter.class,
        },
      })
      .then((res) => {
        setGames([...games, ...res.data.data]);
        setCount(res.data.count);
      })
      .catch((e) => {
        alert('Error while loading games');

        throw e;
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [isLoading, filter]);

  const changeFilter = (key: keyof typeof filter, value: string) => {
    setGames([]);
    setIsLoading(true);
    setFilter((current) => ({ ...current, [key]: value }));
  };

  return (
    <section className="space-y-1 relative pb-8">
      <h2 className="font-bold">
        Recent games
        {!isLoading &&
          filter.isWin === Filter.All &&
          ` (${games.length}G/${games.filter((g) => g.isWin).length}W)`}
        :
      </h2>
      <div className="flex justify-between items-center text-sm">
        <label>
          Show:{' '}
          <select
            className="rounded p-1 bg-gray-100"
            value={filter.isWin}
            onChange={(e) => changeFilter('isWin', e.target.value)}
          >
            <option value={Filter.All}>all games</option>
            <option value={Filter.Wins}>only wins</option>
          </select>
        </label>
        <label>
          Race:{' '}
          <select
            className="rounded p-1 bg-gray-100"
            value={filter.race}
            onChange={(e) => changeFilter('race', e.target.value)}
          >
            <option value={Filter.All}>any</option>
            {allActualRaces.map(({ abbr }) => (
              <option key={abbr} value={abbr}>
                {abbr}
              </option>
            ))}
          </select>
        </label>
        <label>
          Class:{' '}
          <select
            className="rounded p-1 bg-gray-100"
            value={filter.class}
            onChange={(e) => changeFilter('class', e.target.value)}
          >
            <option value={Filter.All}>any</option>
            {allActualClasses.map(({ abbr }) => (
              <option key={abbr} value={abbr}>
                {abbr}
              </option>
            ))}
          </select>
        </label>
      </div>
      {showUp && (
        <button
          className="w-full sticky top-0 py-4 bg-white/80"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          Return to top
        </button>
      )}
      <ul className="space-y-2">
        {!isLoading && games.length === 0 && (
          <li className="text-center py-8">No games found ¯\_(ツ)_/¯</li>
        )}
        {games.map((game) => (
          <GameItem key={game.id} game={game} player={player} />
        ))}
      </ul>
      {hasMore && (
        <div className="flex justify-center items-center pt-8 pb-4">
          <button
            className="flex justify-center items-center space-x-1"
            disabled={isLoading}
            onClick={loadMore}
          >
            <span>{isLoading ? 'Loading' : 'Load more'}</span>
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

const GameItem = ({ game, player }: { game: Game; player: Player }) => {
  const duration = date.duration(game.duration, 'seconds');

  return (
    <li
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
            href={`${game.server.morgueUrl}/${player.name}/${getMorgueUrl(game, player)}`}
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
            {game.isWin ? 'and' : 'with'} {game.uniqueRunes} {addS('rune', game.uniqueRunes)}!
          </span>
        )}
      </div>
      <div className="font-light">
        {game.god ? (
          <>
            Was {getPietyLevel(game.piety, game.god)} of{' '}
            <span className="font-normal">{game.god}</span>
          </>
        ) : (
          'Was an Unbeliever'
        )}
      </div>
      <div className="pt-1 text-gray-400 text-xs flex justify-between">
        <div>
          {formatNumber(game.score)} score points, {formatNumber(game.turns)} turns, lasted for{' '}
          {duration.format('D') !== '0' && (
            <>
              <span>{duration.format('D')} day</span> and{' '}
            </>
          )}
          {duration.format('HH:mm:ss')}
        </div>
        {game.server && (
          <a target="_blank" href={game.server.url} rel="noopener noreferrer" className="underline">
            {game.server.abbreviation}
          </a>
        )}
      </div>
      <div className="flex pt-0.5 justify-between text-gray-400 text-xs">
        <div>
          {date(game.endAt).fromNow()}, {date(game.endAt).format('DD MMM YYYY [at] HH:mm:ss')}
        </div>
        <div>v{game.version}</div>
      </div>
    </li>
  );
};

const formatNumber = (n: number, options?: Intl.NumberFormatOptions) => {
  return n.toLocaleString('en-EN', options);
};

const getMorgueUrl = (game: Game, player: Player) => {
  return `morgue-${player.name}-${date(game.endAt).utc().format('YYYYMMDD-HHmmss')}.txt`;
};

const breakpoints = [30, 50, 75, 100, 120, 160];
const ranks = ['an Initiate', 'a Follower', 'a Believer', 'a Priest', 'an Elder', 'a High Priest'];
const xomBreakpoints = [20, 50, 80, 120, 150, 180];
const xomRanks = [
  'a very special plaything',
  'a special plaything',
  'a plaything',
  'a toy',
  'a favourite toy',
  'a beloved toy',
];

const getPietyLevel = (piety: number | null, god?: string) => {
  if (god === 'Gozag') {
    return 'a Customer';
  }

  if (god === 'Xom') {
    return getPietyLevelGeneric(piety, xomRanks, xomBreakpoints, 'a teddy bear');
  }

  return getPietyLevelGeneric(piety, ranks, breakpoints, 'the Champion');
};

const getPietyLevelGeneric = (
  piety: number | null,
  ranks: string[],
  breakpoints: number[],
  lastRank: string,
) => {
  if (!piety) {
    return first(ranks);
  }

  for (let i = 0; i < breakpoints.length; i++) {
    if (piety < breakpoints[i]) {
      return ranks[i];
    }
  }

  return lastRank;
};
