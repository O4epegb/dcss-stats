import clsx from 'clsx';
import { last, throttle } from 'lodash-es';
import { useState, useEffect } from 'react';
import { useFirstMountState } from 'react-use/lib/useFirstMountState';
import { api } from '@api';
import { Game } from '@types';
import { Loader } from './Loader';
import { CompactGameItem, GameItem } from './GameItem';

export const GamesList = (props: {
  initialTotal: number;
  initialGames?: Game[];
  playerName?: string;
  isWin?: boolean;
  race?: string;
  class?: string;
  god?: string;
  version?: string[];
  runes?: number[];
  includePlayer?: boolean;
  isCompactView?: boolean;
  showSkills?: boolean;
  orderBy?: keyof Pick<Game, 'startAt' | 'endAt'>;
  onChange?: (games: Game[], count: number) => void;
}) => {
  const {
    initialTotal,
    playerName,
    race,
    class: klass,
    god,
    isWin,
    version,
    runes,
    includePlayer,
    isCompactView,
    showSkills,
    orderBy,
    onChange,
  } = props;

  const isFirstMount = useFirstMountState();
  const [games, setGames] = useState<Game[]>(props.initialGames || []);
  const [isLoading, setIsLoading] = useState(() => !props.initialGames);
  const [showUp, setShowUp] = useState(false);
  const [count, setCount] = useState(initialTotal);

  const hasMore = count > games.length;
  const GameComponent = isCompactView ? CompactGameItem : GameItem;

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
          version,
          runes,
          orderBy,
        },
      })
      .then((res) => {
        const newGames = after ? [...games, ...res.data.data] : res.data.data;
        setGames(newGames);
        setCount(res.data.count);
        onChange?.(newGames, res.data.count);
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
  }, [race, klass, god, isWin, String(version), runes]);

  return (
    <div className="relative">
      {showUp && (
        <button
          className="sticky top-0 w-full bg-white/80 py-4"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          Return to top
        </button>
      )}
      <ul className={clsx(isCompactView ? 'divide-y' : 'space-y-2')}>
        {!isLoading && games.length === 0 && (
          <li className="py-8 text-center">No games found ¯\_(ツ)_/¯</li>
        )}
        {games.map((game) => {
          return (
            <li key={game.id}>
              <GameComponent game={game} includePlayer={includePlayer} showSkills={showSkills} />
            </li>
          );
        })}
      </ul>
      {(hasMore || isLoading) && (
        <div className="flex items-center justify-center pt-8 pb-4">
          <button
            className="flex items-center justify-center space-x-1"
            disabled={isLoading}
            onClick={loadMore}
          >
            <span>{isLoading ? 'Loading' : 'Load more'}</span>
            {isLoading && <Loader />}
          </button>
        </div>
      )}
    </div>
  );
};
