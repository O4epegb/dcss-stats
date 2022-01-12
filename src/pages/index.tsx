import { useRouter } from 'next/router';
import Link from 'next/link';
import { useState, useCallback, memo, Fragment, useEffect } from 'react';
import clsx from 'clsx';
import { useCombobox } from 'downshift';
import { GetStaticProps } from 'next';
import { debounce, orderBy, startsWith } from 'lodash-es';
import { api } from '@api';
import { formatNumber, getPlayerPageHref, RaceConditionGuard } from '@utils';
import { Player, Server } from '@types';
import { Highlighted } from '@components/Highlighted';
import { createServerApi } from '@api/server';
import { Logo } from '@components/Logo';
import { getFavorites } from '@screens/Player/utils';
import { Loader } from '@components/Loader';
import { Tooltip } from '@components/Tooltip';

const MainPage = (props: Props) => {
  const [isNavigating, setIsNavigating] = useState(false);
  const [query, setQuery] = useState('');

  const onLinkClick = useCallback((name: string) => {
    setIsNavigating(true);
    setQuery(name);
  }, []);

  return (
    <div className="container mx-auto px-4 min-h-screen flex flex-col pt-8 md:pt-0 md:justify-center items-center">
      <div className="w-full max-w-lg space-y-4">
        <header className="w-full flex justify-between items-center">
          <Logo />
          <div className="flex gap-5">
            <Link href="/suggest">
              <a className="group">
                <span className="text-xs sm:text-base group-hover:underline">Combos</span>
              </a>
            </Link>
            <Link href="/search">
              <a className="group">
                <span className="text-xs sm:text-base group-hover:underline">Search</span>{' '}
                <span className="bg-indigo-400 text-white text-xs rounded px-1 py-0.5">beta</span>
              </a>
            </Link>
          </div>
        </header>
        <Search
          isNavigating={isNavigating}
          setIsNavigating={setIsNavigating}
          query={query}
          setQuery={setQuery}
        />
        <Stats {...props} onLinkClick={onLinkClick} />
        <footer className="text-xs text-gray-400 space-y-1">
          <div>
            Tracked servers:{' '}
            {props.servers.map((s, index) => (
              <Fragment key={index}>
                {index !== 0 && ', '}
                <a
                  key={s.abbreviation}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline"
                >
                  {s.abbreviation}
                </a>
              </Fragment>
            ))}
            .{' '}
            <Link prefetch={false} href="/servers">
              <a className="hover:underline">more &gt;</a>
            </Link>
          </div>
          <div>
            Made by <span className="text-gray-500 font-light">totalnoob</span>, DM on{' '}
            <a
              href="https://discord.gg/pKCNTunFeW"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline"
            >
              RL Discord
            </a>{' '}
            with bugs and suggestions
          </div>
          <div>
            <a
              href="https://github.com/O4epegb/dcss-stats"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline"
            >
              Github
            </a>
          </div>
        </footer>
      </div>
    </div>
  );
};

const Stats = memo(
  ({ wins, games, top, onLinkClick }: Props & { onLinkClick: (name: string) => void }) => {
    const [favorites, setFavorites] = useState<null | string[]>(null);

    useEffect(() => {
      setFavorites(getFavorites().split(',').filter(Boolean));
    }, []);

    return (
      <div className="grid grid-cols-2 gap-x-10 gap-y-4 text-sm">
        <div className="space-y-1">
          <h2 className="font-semibold">Top by games:</h2>
          <ul>
            {top.byGames.map((item) => (
              <li key={item.name} className="flex justify-between">
                <Link prefetch={false} href={getPlayerPageHref(item.name)}>
                  <a
                    className="overflow-ellipsis overflow-hidden whitespace-nowrap hover:underline"
                    onClick={(e) => {
                      if (!e.metaKey) {
                        onLinkClick(item.name);
                      }
                    }}
                  >
                    {item.name}
                  </a>
                </Link>
                <span className="tabular-nums">{formatNumber(item.games)}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="space-y-1">
          <h2 className="font-semibold">Top by wins:</h2>
          <ul>
            {top.byWins.map((item) => (
              <li key={item.name} className="flex justify-between">
                <Link prefetch={false} href={getPlayerPageHref(item.name)}>
                  <a
                    className="overflow-ellipsis overflow-hidden whitespace-nowrap hover:underline"
                    onClick={(e) => {
                      if (!e.metaKey) {
                        onLinkClick(item.name);
                      }
                    }}
                  >
                    {item.name}
                  </a>
                </Link>
                <span className="tabular-nums">{formatNumber(item.wins)}</span>
              </li>
            ))}
          </ul>
        </div>
        <h2 className="font-semibold flex justify-between">
          Total games: <span>{formatNumber(games)}</span>
        </h2>
        <h2 className="font-semibold flex justify-between">
          Total wins: <span>{formatNumber(wins)}</span>
        </h2>
        <div className="space-y-1">
          <div className="flex justify-between gap-1">
            <h2 className="font-semibold ">Top by win rate, %:</h2>
            <Tooltip content="Minimum 75 games played">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-gray-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
                  clipRule="evenodd"
                />
              </svg>
            </Tooltip>
          </div>
          <ul>
            {top.byWinrate.map((item) => (
              <li key={item.name} className="flex justify-between">
                <Link prefetch={false} href={getPlayerPageHref(item.name)}>
                  <a
                    className="overflow-ellipsis overflow-hidden whitespace-nowrap hover:underline"
                    onClick={(e) => {
                      if (!e.metaKey) {
                        onLinkClick(item.name);
                      }
                    }}
                  >
                    {item.name}
                  </a>
                </Link>
                <span className="tabular-nums">
                  {formatNumber(item.winrate * 100, {
                    maximumFractionDigits: 2,
                    minimumFractionDigits: 2,
                  })}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div className="space-y-1">
          <h2 className="font-semibold ">Your favorites:</h2>
          {favorites && (
            <ul className="max-h-[200px] overflow-y-auto">
              {favorites.length === 0 && (
                <li className="text-gray-400">
                  Nobody added yet
                  <div>
                    Use <span className="font-medium">star</span> icon on player page near their
                    name
                  </div>
                  <div>Data stored locally on your device</div>
                </li>
              )}
              {favorites.map((name) => (
                <li key={name}>
                  <Link prefetch={false} href={getPlayerPageHref(name)}>
                    <a
                      className="overflow-ellipsis overflow-hidden whitespace-nowrap hover:underline"
                      onClick={(e) => {
                        if (!e.metaKey) {
                          onLinkClick(name);
                        }
                      }}
                    >
                      {name}
                    </a>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    );
  },
);

type SearchItem = Player;

const Search = ({
  isNavigating,
  setIsNavigating,
  query,
  setQuery,
}: {
  isNavigating: boolean;
  setIsNavigating: (state: boolean) => void;
  query: string;
  setQuery: (state: string) => void;
}) => {
  const [items, setItems] = useState<SearchItem[]>([]);
  const [guard] = useState(() => new RaceConditionGuard());
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const goToPlayerPage = useCallback((slug: string) => {
    setIsNavigating(true);
    router.push(getPlayerPageHref(slug));
  }, []);

  const { isOpen, highlightedIndex, getComboboxProps, getInputProps, getMenuProps, getItemProps } =
    useCombobox({
      id: 'MainSearch',
      items,
      inputValue: query,
      onSelectedItemChange: (e) => {
        if (e.selectedItem) {
          setQuery(e.selectedItem.name);
          goToPlayerPage(e.selectedItem.name);
        }
      },
    });

  const fetchData = useCallback(
    debounce((query: string) => {
      setIsLoading(true);

      guard
        .getGuardedPromise(
          api.get<{ data: Array<SearchItem> }>('/players', {
            params: { query },
          }),
        )
        .then((res) => {
          const target = query.toLowerCase();

          setItems(orderBy(res.data.data, (x) => startsWith(x.name.toLowerCase(), target), 'desc'));
          setIsLoading(false);
        });
    }, 400),
    [],
  );

  return (
    <div {...getComboboxProps({ className: 'relative' })}>
      {isNavigating && (
        <div className="absolute right-2 top-[50%] -translate-y-1/2">
          <Loader />
        </div>
      )}

      <input
        autoFocus
        placeholder='Type player name, e.g. "MegaDestroyer3000"'
        className="block border rounded w-full border-gray-400 px-2 h-10"
        value={query}
        {...getInputProps({
          disabled: isNavigating,
          onFocus(e) {
            e.target.select();
          },
          onKeyDown: (e) => {
            if (e.key === 'Enter' && highlightedIndex === -1 && query) {
              (e.nativeEvent as any).preventDownshiftDefault = true;
              goToPlayerPage(query);
            }
          },
          onChange: (e) => {
            const query = e.currentTarget.value.trim();
            setIsLoading(Boolean(query));
            setQuery(query);

            if (query) {
              fetchData(query);
            } else {
              setItems([]);
            }
          },
        })}
      />

      <div
        className={clsx(
          'absolute top-full left-0 z-20 w-full mt-2 overflow-hidden rounded shadow',
          isOpen ? 'block' : 'hidden',
        )}
      >
        <ul {...getMenuProps()} className="max-h-64 bg-white py-2 overflow-y-auto">
          {isOpen && (
            <>
              {isLoading ? (
                <li className="flex justify-center">Loading...</li>
              ) : (
                <>
                  {items.length === 0 && (
                    <li className="flex justify-center">
                      {query ? 'Nothing found' : 'Specify your request'}
                    </li>
                  )}
                  {items.map((item, index) => {
                    const active = items[highlightedIndex] === item;

                    return (
                      <li
                        key={index}
                        className={clsx('px-2', active && 'bg-gray-100')}
                        {...getItemProps({
                          item,
                          index,
                        })}
                      >
                        <Highlighted text={item.name} query={query} />
                      </li>
                    );
                  })}
                </>
              )}
            </>
          )}
        </ul>
      </div>
    </div>
  );
};

type Props = Response;

type Response = {
  games: number;
  wins: number;
  servers: Server[];
  top: {
    byGames: Array<Pick<Player, 'name'> & { games: number }>;
    byWins: Array<Pick<Player, 'name'> & { wins: number }>;
    byWinrate: Array<Pick<Player, 'name'> & { winrate: number }>;
  };
};

export const getStaticProps: GetStaticProps<Props> = async () => {
  const res = await createServerApi().api.get<{ data: Response }>('/stats');

  return {
    revalidate: 300,
    props: res.data.data,
  };
};

export default MainPage;
