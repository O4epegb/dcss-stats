import { useRouter } from 'next/router';
import Link from 'next/link';
import { useState, useCallback, memo, Fragment } from 'react';
import clsx from 'clsx';
import { useCombobox } from 'downshift';
import { GetStaticProps } from 'next';
import { debounce } from 'lodash-es';
import { api } from '@api';
import { addS, formatNumber, RaceConditionGuard } from '@utils';
import { Player, Server } from '@types';
import refreshSvg from '@refresh.svg';
import { Highlighted } from '@components/Highlighted';
import { createServerApi } from '@api/server';
import { Logo } from '@components/Logo';

const MainPage = (props: Props) => {
  const [isNavigating, setIsNavigating] = useState(false);
  const [query, setQuery] = useState('');

  const onLinkClick = useCallback((name: string) => {
    setIsNavigating(true);
    setQuery(name);
  }, []);

  return (
    <div className="container mx-auto px-4 min-h-screen flex flex-col pt-8 md:pt-0 md:justify-center items-center space-y-4">
      <header>
        <Logo />
      </header>

      <div className="w-full max-w-md space-y-4">
        <Search
          isNavigating={isNavigating}
          setIsNavigating={setIsNavigating}
          query={query}
          setQuery={setQuery}
        />
        <Stats {...props} onLinkClick={onLinkClick} />
      </div>
    </div>
  );
};

const Stats = memo(
  ({
    players,
    servers,
    wins,
    winners,
    games,
    onLinkClick,
  }: Props & { onLinkClick: (name: string) => void }) => {
    return (
      <div className="grid grid-cols-2 gap-x-10 gap-y-4 text-sm">
        <div className="space-y-1">
          <h2 className="font-semibold">Top by games:</h2>
          <ul>
            {players.map((player) => (
              <li key={player.id} className="flex justify-between">
                <Link prefetch={false} href={getPlayerPageHref(player.name)}>
                  <a
                    className="overflow-ellipsis overflow-hidden whitespace-nowrap hover:underline"
                    onClick={() => onLinkClick(player.name)}
                  >
                    {player.name}
                  </a>
                </Link>
                {formatNumber(player.games)}
              </li>
            ))}
          </ul>
        </div>
        <div className="space-y-1">
          <h2 className="font-semibold">Top by wins:</h2>
          <ul>
            {winners.map((player) => (
              <li key={player.id} className="flex justify-between">
                <Link prefetch={false} href={getPlayerPageHref(player.name)}>
                  <a
                    className="overflow-ellipsis overflow-hidden whitespace-nowrap hover:underline"
                    onClick={() => onLinkClick(player.name)}
                  >
                    {player.name}
                  </a>
                </Link>
                {formatNumber(player.wins)}
              </li>
            ))}
          </ul>
        </div>
        <h2 className="font-semibold">Total games saved: {formatNumber(games)}</h2>
        <h2 className="font-semibold">Total wins: {formatNumber(wins)}</h2>
        <div className="text-xs text-gray-400">
          Tracked servers:{' '}
          {servers.map((s, index) => (
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
        </div>
      </div>
    );
  },
);

type SearchItem = Player & { games: number };

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
    debounce((query) => {
      setIsLoading(true);

      guard
        .getGuardedPromise(
          api.get<{ data: Array<SearchItem> }>('/players', {
            params: { query },
          }),
        )
        .then((res) => {
          setItems(res.data.data);
          setIsLoading(false);
        });
    }, 400),
    [],
  );

  return (
    <div {...getComboboxProps({ className: 'relative' })}>
      {isNavigating && (
        <div className="absolute right-2 top-[50%] -translate-y-1/2">
          <div
            className="w-5 h-5 animate-spin"
            style={{ backgroundImage: `url(${refreshSvg.src})` }}
          />
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
                        className={clsx('px-2 flex justify-between', active && 'bg-gray-100')}
                        {...getItemProps({
                          item,
                          index,
                        })}
                      >
                        <Highlighted text={item.name} query={query} /> {item.games}{' '}
                        {addS('game', item.games)}
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
  players: Array<Player & { games: number }>;
  winners: Array<Player & { wins: number }>;
  games: number;
  wins: number;
  servers: Server[];
};

export const getStaticProps: GetStaticProps<Props> = async () => {
  const res = await createServerApi().api.get<{ data: Response }>('/stats');

  return {
    revalidate: 300,
    props: res.data.data,
  };
};

const getPlayerPageHref = (slug: string) => ({
  pathname: `/players/[slug]`,
  query: {
    slug,
  },
});

export default MainPage;
