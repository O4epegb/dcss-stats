import clsx from 'clsx';
import { first, last, throttle } from 'lodash-es';
import { useState, useEffect } from 'react';
import { useFirstMountState } from 'react-use/lib/useFirstMountState';
import { addS, date, formatNumber } from '@utils';
import { api } from '@api';
import { Game } from '@types';
import externalLinkSvg from '@external.svg';
import refreshSvg from '@refresh.svg';

export const GamesList = (props: {
  initialTotal: number;
  initialGames?: Game[];
  playerName?: string;
  isWin?: boolean;
  race?: string;
  class?: string;
  god?: string;
  version?: string[];
  includePlayer?: boolean;
  onChange?: (games: Game[]) => void;
}) => {
  const {
    initialTotal,
    playerName,
    race,
    class: klass,
    god,
    isWin,
    version,
    includePlayer,
    onChange,
  } = props;
  const isFirstMount = useFirstMountState();
  const [games, setGames] = useState<Game[]>(props.initialGames || []);
  const [isLoading, setIsLoading] = useState(() => !props.initialGames);
  const [showUp, setShowUp] = useState(false);
  const [count, setCount] = useState(initialTotal);

  const hasMore = count > games.length;

  const loadData = (after?: string) => {
    setIsLoading(true);

    api
      .get<{ data: Game[]; count: number }>('/games', {
        params: {
          player: playerName,
          after,
          isWin,
          race,
          class: klass,
          god,
          includePlayer,
          version,
        },
      })
      .then((res) => {
        const newGames = after ? [...games, ...res.data.data] : res.data.data;
        setGames(newGames);
        setCount(res.data.count);
        onChange?.(newGames);
      })
      .catch((e) => {
        alert('Error while loading games');

        throw e;
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const loadMore = () => {
    loadData(last(games)?.id);
  };

  useEffect(() => {
    const listener = throttle(() => {
      setShowUp(window.scrollY > window.innerHeight * 2);
    }, 100);

    document.addEventListener('scroll', listener);

    return () => document.removeEventListener('scroll', listener);
  }, []);

  useEffect(() => {
    if (isFirstMount && props.initialGames) {
      return;
    }

    loadData();
  }, [race, klass, god, isWin]);

  return (
    <div className="relative">
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
          <GameItem
            key={game.id}
            game={game}
            playerName={playerName || game.player?.name}
            includePlayer={includePlayer}
          />
        ))}
      </ul>
      {(hasMore || isLoading) && (
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
    </div>
  );
};

const GameItem = ({
  game,
  playerName,
  includePlayer,
}: {
  game: Game;
  playerName?: string;
  includePlayer?: boolean;
}) => {
  const duration = date.duration(game.duration, 'seconds');

  return (
    <li
      className={clsx(
        'py-1 px-2 border rounded border-gray-200 text-sm',
        game.isWin && 'border-l-green-500 border-l-2',
      )}
    >
      <div className="font-medium">
        {game.server && playerName && (
          <a
            className="float-right w-5 h-5 bg-no-repeat bg-center"
            target="_blank"
            href={`${game.server.morgueUrl}/${playerName}/${getMorgueUrl(game, playerName)}`}
            rel="noopener noreferrer"
            title="Morgue"
            style={{
              backgroundImage: `url(${externalLinkSvg.src})`,
            }}
          />
        )}
        {includePlayer && playerName && <div className="font-medium">{playerName}</div>}
        {game.race} {game.class} <span className="font-light">the {game.title}</span>
      </div>

      <div>
        XL:{game.xl},{' '}
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
          <a
            target="_blank"
            href={game.server.url}
            title={`Server: ${game.server.name}, ${game.server.url}`}
            rel="noopener noreferrer"
            className="underline"
          >
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

const getMorgueUrl = (game: Game, playerName: string) => {
  return `morgue-${playerName}-${date(game.endAt).utc().format('YYYYMMDD-HHmmss')}.txt`;
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
