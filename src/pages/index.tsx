import { useRouter } from 'next/router';
import Link from 'next/link';
import { useState, useCallback, memo, useEffect, ReactNode } from 'react';
import clsx from 'clsx';
import { useCombobox } from 'downshift';
import { GetStaticProps } from 'next';
import { map, orderBy, startsWith } from 'lodash-es';
import dayjs from 'dayjs';
import useSWRImmutable from 'swr/immutable';
import useDebounce from 'react-use/lib/useDebounce';
import { api } from '@api';
import { formatDuration, formatNumber, getPlayerPageHref } from '@utils';
import { Class, Game, God, Player, Race } from '@types';
import { Highlighted } from '@components/Highlighted';
import { createServerApi } from '@api/server';
import { Logo } from '@components/Logo';
import { getFavorites } from '@screens/Player/utils';
import { Loader } from '@components/Loader';
import { HelpBubble } from '@components/Tooltip';
import { getMorgueUrl } from '@components/GameItem';
import { WinrateStats } from '@components/WinrateStats';

const MainPage = (props: Props) => {
  const [isNavigating, setIsNavigating] = useState(false);
  const [query, setQuery] = useState('');

  const onLinkClick = useCallback((name: string) => {
    setIsNavigating(true);
    setQuery(name);
  }, []);

  return (
    <div className="container mx-auto flex min-h-screen flex-col items-center px-4 pt-8 md:justify-center md:pt-0">
      <div className="w-full max-w-5xl space-y-4 py-4">
        <header className="flex w-full items-center justify-between">
          <Logo />
          <div className="flex gap-5">
            <Link href="/suggest">
              <a className="group">
                <span className="text-xs group-hover:underline sm:text-base">Combos</span>
              </a>
            </Link>
            <Link href="/search">
              <a className="group">
                <span className="text-xs group-hover:underline sm:text-base">Search</span>{' '}
                <span className="rounded bg-indigo-400 px-1 py-0.5 text-xs text-white">beta</span>
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

        <footer className="grid justify-between gap-1 text-xs text-gray-400 md:grid-cols-2">
          <div>
            Player and game statistics for{' '}
            <a
              href="https://crawl.develz.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline"
            >
              Dungeon Crawl Stone Soup
            </a>
          </div>

          <div className="flex gap-4 md:justify-end">
            <Link prefetch={false} href="/servers">
              <a className="hover:underline">Tracked servers</a>
            </Link>

            <a
              href="https://github.com/O4epegb/dcss-stats"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline"
            >
              Github
            </a>

            <a
              href="https://www.buymeacoffee.com/totalnoob"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline"
            >
              Donate to support this site
            </a>
          </div>

          <div>
            Made by <span className="font-light text-gray-500">totalnoob</span>, DM on{' '}
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
        </footer>
      </div>
    </div>
  );
};

type NormalizedData = {
  race: Race | undefined;
  class: Class | undefined;
  god: God | undefined;
  winrate: number;
  wins: number;
  total: number;
}[];

const Stats = memo(
  ({
    wins,
    games,
    top,
    races,
    classes,
    gods,
    combosData,
    onLinkClick,
  }: Props & { onLinkClick: (name: string) => void }) => {
    const [favorites, setFavorites] = useState<null | string[]>(null);

    useEffect(() => {
      setFavorites(getFavorites().split(',').filter(Boolean));
    }, []);

    const data: NormalizedData = map(combosData.combos, (value, key) => {
      const [raceAbbr, classAbbr, godName] = key.split(',');

      return {
        ...value,
        race: races.find((x) => x.abbr === raceAbbr),
        class: classes.find((x) => x.abbr === classAbbr),
        god: gods.find((x) => x.name === godName),
        winrate: (value.wins / value.total) * 100,
      };
    });

    return (
      <div className="flex flex-col gap-x-10 gap-y-4">
        <div className="grid grid-cols-1 gap-x-10 gap-y-4 md:grid-cols-2">
          <div className="grid grid-cols-2 gap-x-10 gap-y-4 text-sm">
            <List
              title="Top by win rate, %"
              tooltip="Minimum 75 games played"
              items={top.byWinrate.map((item) => ({
                name: item.name,
                count: formatNumber(item.winrate * 100, {
                  maximumFractionDigits: 2,
                  minimumFractionDigits: 2,
                }),
              }))}
              onLinkClick={onLinkClick}
            />
            <List
              title="Top by wins"
              items={top.byWins.map((item) => ({
                name: item.name,
                count: formatNumber(item.wins),
              }))}
              onLinkClick={onLinkClick}
            />

            <h2 className="flex justify-between font-semibold">
              Total games: <span>{formatNumber(games)}</span>
            </h2>
            <h2 className="flex justify-between font-semibold">
              Total wins: <span>{formatNumber(wins)}</span>
            </h2>

            <List
              title="Top by distinct titles earned"
              items={top.byTitles.map((item) => ({
                name: item.name,
                count: formatNumber(item.titles),
              }))}
              onLinkClick={onLinkClick}
            />

            <List
              title="Your favorites"
              placeholder={
                favorites && favorites.length === 0 ? (
                  <div className="text-gray-400">
                    Nobody added yet
                    <div>
                      Use <span className="font-medium">star</span> icon on player page next to
                      their name
                    </div>
                    <div>Data is stored locally on your device</div>
                  </div>
                ) : undefined
              }
              items={(favorites ?? []).map((name) => ({
                name,
              }))}
              onLinkClick={onLinkClick}
            />
          </div>

          <hr className="md:hidden" />

          <div className="space-y-1 text-sm">
            <h2 className="flex gap-1 font-semibold">
              Popular picks in the last 7 days
              <HelpBubble content="Latest game version only" />
            </h2>
            <div className="space-y-2">
              <PopularList title="By wins" data={orderBy(data, (x) => x.wins, 'desc')} />
              <PopularList
                title="By winrate"
                tooltip="Minimum 10 games played"
                data={orderBy(
                  data.filter((x) => x.total > 10),
                  (x) => x.winrate,
                  'desc',
                )}
              />
              <PopularList
                title="By total amount of games"
                data={orderBy(data, (x) => x.total, 'desc')}
              />
            </div>
          </div>
        </div>

        <hr />

        <Table
          games={top.gamesByTC}
          title="Fastest wins by turn count"
          highlight="Turns"
          onLinkClick={onLinkClick}
        />
        <Table
          games={top.gamesByDuration}
          title="Fastest wins by realtime"
          highlight="Duration"
          onLinkClick={onLinkClick}
        />
        <Table
          games={top.gamesByScore}
          title="Top highscores"
          highlight="Score"
          onLinkClick={onLinkClick}
        />
      </div>
    );
  },
);

const PopularList = ({
  title,
  data,
  tooltip,
}: {
  title: string;
  data: NormalizedData;
  tooltip?: string;
}) => {
  return (
    <div>
      <div className="flex gap-1">
        <div className="font-semibold">{title}:</div>
        {tooltip && <HelpBubble content={tooltip} />}
      </div>
      <div>
        {data.slice(0, 7).map((x, index) => (
          <div key={index} className="flex justify-between">
            <div>
              {x.race?.abbr}
              {x.class?.abbr} {x.god?.name && `of ${x.god?.name}`}
            </div>
            <WinrateStats small games={x.total} wins={x.wins} />
          </div>
        ))}
      </div>
    </div>
  );
};

const Table = ({
  games,
  title,
  highlight,
  onLinkClick,
}: {
  games: Game[];
  title: string;
  highlight: typeof tableData[number]['title'];
  onLinkClick: (name: string) => void;
}) => {
  const tableData = [
    {
      title: 'Player',
      type: 'string',
      getter: (game: Game) => (
        <>
          {game.server && (
            <a
              className="absolute top-0 left-0 bottom-0 right-0"
              href={getMorgueUrl(game.server.morgueUrl, game)}
              target="_blank"
              rel="noreferrer"
            ></a>
          )}
          <Link key={game.name} prefetch={false} href={getPlayerPageHref(game.name)}>
            <a
              className="relative hover:underline"
              onClick={(e) => {
                if (!e.metaKey && !e.ctrlKey) {
                  onLinkClick(game.name);
                }
              }}
            >
              {game.name}
            </a>
          </Link>
        </>
      ),
    },
    {
      title: 'Score',
      type: 'number',
      getter: (game: Game) => formatNumber(game.score),
    },
    {
      title: 'Char',
      type: 'string',
      getter: (game: Game) => game.char,
    },
    {
      title: 'God',
      type: 'string',
      getter: (game: Game) => game.god,
    },
    {
      title: 'XL',
      type: 'number',
      getter: (game: Game) => game.xl,
    },
    {
      title: 'Turns',
      type: 'number',
      getter: (game: Game) => formatNumber(game.turns),
    },
    {
      title: 'Duration',
      type: 'string',
      getter: (game: Game) => formatDuration(game.duration),
    },
    {
      title: 'Runes',
      type: 'number',
      getter: (game: Game) => game.runes,
    },
    {
      title: 'Date',
      type: 'string',
      getter: (game: Game) => dayjs(game.endAt).format('DD MMM YYYY'),
    },
    {
      title: 'Version',
      type: 'string',
      getter: (game: Game) => game.version,
    },
  ] as const;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <caption className="pb-1 text-left font-semibold">{title}:</caption>
        <thead>
          <tr>
            {tableData.map(({ title }, index) => (
              <th
                key={title}
                className={clsx(
                  'w-[10%] whitespace-nowrap text-left font-medium md:overflow-visible',
                  index === 0 && 'w-[15%]',
                  index !== 0 && index !== tableData.length && 'px-1',
                )}
              >
                {title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {games.map((game) => (
            <tr key={game.id} className="relative odd:bg-gray-50 hover:bg-amber-100">
              {tableData.map(({ title, getter }, index) => (
                <td
                  key={title}
                  className={clsx(
                    'whitespace-nowrap text-left tabular-nums md:overflow-visible',
                    highlight === title && 'text-amber-700',
                    index !== 0 && index !== tableData.length && 'px-1',
                  )}
                >
                  {getter(game)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const List = ({
  title,
  tooltip,
  items,
  placeholder,
  onLinkClick,
}: {
  title: string;
  items: Array<{
    name: string;
    count?: string;
  }>;
  onLinkClick: (name: string) => void;
  placeholder?: ReactNode;
  tooltip?: string;
}) => {
  return (
    <div className="space-y-1">
      <div className="flex justify-between gap-1">
        <h2 className="font-semibold">{title}:</h2>
        {tooltip && <HelpBubble content={tooltip} />}
      </div>
      <div>
        {placeholder}
        {items.map((item) => (
          <Link key={item.name} prefetch={false} href={getPlayerPageHref(item.name)}>
            <a
              className="-mx-1 flex justify-between rounded px-1 hover:bg-amber-100"
              onClick={(e) => {
                if (!e.metaKey && !e.ctrlKey) {
                  onLinkClick(item.name);
                }
              }}
            >
              <span className="overflow-hidden overflow-ellipsis whitespace-nowrap ">
                {item.name}
              </span>
              {item.count && <span className="tabular-nums">{item.count}</span>}
            </a>
          </Link>
        ))}
      </div>
    </div>
  );
};

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
  const router = useRouter();
  const [debouncedQuery, setDebouncedQuery] = useState('');

  useDebounce(() => setDebouncedQuery(query), 400, [query]);

  const { data, isValidating: isLoading } = useSWRImmutable(
    debouncedQuery ? ['/players', { query: debouncedQuery }] : null,
    (url, params) =>
      api.get<{ data: Array<SearchItem> }>(url, { params }).then((res) => {
        const target = params.query.toLowerCase();
        return orderBy(res.data.data, (x) => startsWith(x.name.toLowerCase(), target), 'desc');
      }),
  );
  const items = data ?? [];

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
        className="block h-10 w-full rounded border border-gray-400 px-2"
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
            setQuery(e.currentTarget.value.trim());
          },
        })}
      />

      <div
        className={clsx(
          'absolute top-full left-0 z-20 mt-2 w-full overflow-hidden rounded shadow',
          isOpen ? 'block' : 'hidden',
        )}
      >
        <ul {...getMenuProps()} className="max-h-64 overflow-y-auto bg-white py-2">
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

type Stats = { wins: number; total: number };
type Combos = Record<string, Stats>;
type CombosData = Stats & { combos: Combos };

type Response = {
  games: number;
  wins: number;
  races: Race[];
  classes: Class[];
  gods: God[];
  combosData: CombosData;
  top: {
    byWins: Array<Pick<Player, 'name'> & { wins: number }>;
    byWinrate: Array<Pick<Player, 'name'> & { winrate: number }>;
    byTitles: Array<Pick<Player, 'name'> & { titles: number }>;
    gamesByTC: Array<Game>;
    gamesByDuration: Array<Game>;
    gamesByScore: Array<Game>;
  };
};

type Props = Response;

export const getStaticProps: GetStaticProps<Props> = async () => {
  const res = await createServerApi().api.get<{ data: Response }>('/stats');

  return {
    revalidate: 300,
    props: res.data.data,
  };
};

export default MainPage;
