import { useState, useEffect, useMemo } from 'react';
import clsx from 'clsx';
import { GetStaticProps } from 'next';
import { capitalize, flow, map, orderBy, some } from 'lodash-es';
import { api } from '@api';
import { formatNumber } from '@utils';
import { Class, God, Race } from '@types';
import { createServerApi } from '@api/server';
import { Logo } from '@components/Logo';
import { GamesList } from '@components/GamesList';
import { WinrateStats } from '@components/WinrateStats';
import { Loader } from '@components/Loader';
import { Tooltip } from '@components/Tooltip';

enum Filter {
  Any = 'any',
}

type Stats = { wins: number; total: number };
type Combos = Record<string, Stats>;
type SuggestResponse = Stats & { combos: Combos };
type Data = SuggestResponse & { race?: Race; class?: Class; god?: God };

const SuggestPage = (props: Props) => {
  type SortingKey = keyof ReturnType<typeof normalizeData>[number];

  const races = useMemo(
    () =>
      orderBy(
        props.races.filter((x) => x.trunk),
        (x) => x.name,
      ),
    [],
  );
  const classes = useMemo(
    () =>
      orderBy(
        props.classes.filter((x) => x.trunk),
        (x) => x.name,
      ),
    [],
  );
  const gods = useMemo(() => orderBy(props.gods, (x) => x.name.toLowerCase()), []);
  const [isLoading, setIsLoading] = useState(false);
  const [showWins, setShowWins] = useState(true);
  const [view, setView] = useState<'stats' | 'games'>('stats');
  const [sorting, setSorting] = useState<{ key: SortingKey; direction: 'desc' | 'asc' }>(() => ({
    key: 'total',
    direction: 'desc',
  }));
  const [data, setData] = useState<null | Data>(null);
  const [filter, setFilter] = useState(() => ({
    race: Filter.Any,
    class: Filter.Any,
    god: Filter.Any,
  }));

  const changeFilter = (key: keyof typeof filter, value: string) => {
    setFilter((current) => ({ ...current, [key]: value }));
  };

  const somethingSelected = some(filter, (value) => value !== Filter.Any);
  const buttonEnabled = !isLoading && somethingSelected;

  const selected = {
    race: races.find((x) => x.abbr === filter.race),
    class: classes.find((x) => x.abbr === filter.class),
    god: gods.find((x) => x.name === filter.god),
  };

  useEffect(() => {
    if (!isLoading) {
      return;
    }

    api
      .get<SuggestResponse>('/suggest', {
        params: {
          race: selected.race?.abbr,
          class: selected.class?.abbr,
          god: selected.god?.name,
        },
      })
      .then((res) => {
        setData({ ...res.data, ...selected });
      })
      .catch((e) => {
        alert('Error while loading data');

        throw e;
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [isLoading]);

  const normalizeData = ({ combos, race, class: klass, god }: Data) => {
    return map(combos, (value, key) => {
      const [raceAbbr, classAbbr, godName] = key.split(',');

      return {
        ...value,
        race: race || races.find((x) => x.abbr === raceAbbr),
        class: klass || classes.find((x) => x.abbr === classAbbr),
        god: god || gods.find((x) => x.name === godName),
        winrate: (value.wins / value.total) * 100,
      };
    });
  };

  return (
    <div
      className={clsx(
        'container mx-auto px-4 min-h-screen flex flex-col pt-8 pb-8 items-center space-y-4',
        !data && 'md:justify-center md:pt-0',
      )}
    >
      <header>
        <Logo />
      </header>
      <div className="w-full m-auto max-w-lg bg-blue-100 rounded px-2 py-1 text-sm">
        <span className="font-semibold">TL;DR:</span> pick race, class, or god you want to play (or
        even all of them). Hit the button to see win rate of your combo, as well as recent games of
        other players (only version 0.27 and 0.28 at this moment).
        <br />
        This tool in under development, with bugs and suggestions DM @totalnoob on{' '}
        <a
          href="https://discord.gg/pKCNTunFeW"
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
        >
          discord
        </a>
      </div>
      <div className="flex flex-wrap gap-2 md:justify-center w-full">
        I want to play
        <select
          className="rounded p-1 bg-gray-100 hover:bg-gray-200 transition-colors"
          value={filter.race}
          onChange={(e) => changeFilter('race', e.target.value)}
        >
          <option value={Filter.Any}>any race</option>
          {races.map(({ name, abbr }) => (
            <option key={name} value={abbr}>
              {name}
            </option>
          ))}
        </select>
        <select
          className="rounded p-1 bg-gray-100 hover:bg-gray-200 transition-colors"
          value={filter.class}
          onChange={(e) => changeFilter('class', e.target.value)}
        >
          <option value={Filter.Any}>either class</option>
          {classes.map(({ name, abbr }) => (
            <option key={name} value={abbr}>
              {name}
            </option>
          ))}
        </select>
        and
        <select
          className="rounded p-1 bg-gray-100 hover:bg-gray-200 transition-colors"
          value={filter.god}
          onChange={(e) => changeFilter('god', e.target.value)}
        >
          <option value={Filter.Any}>whatever god</option>
          {gods.map(({ name }) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </div>
      <div className="w-full m-auto max-w-lg flex justify-evenly items-center gap-2">
        <Tooltip
          hideOnClick={false}
          disabled={somethingSelected}
          content="Select at least one option"
        >
          <button
            className={clsx(
              'flex items-center gap-x-2 rounded border px-4 py-2 transition-colors',
              buttonEnabled && 'hover:bg-gray-100',
            )}
            onClick={() => {
              if (buttonEnabled) {
                setIsLoading(true);
              }
            }}
          >
            Time to have some fun!
            {isLoading && <Loader />}
          </button>
        </Tooltip>
      </div>

      {data && (
        <>
          <div className="m-auto w-full max-w-lg space-y-2">
            <hr />
            <h2 className="text-center text-xl">
              {data.race?.name || 'Something'} {data.class?.name || 'Something'}{' '}
              <span className="font-light">of</span> {data.god?.name || 'Something'}
            </h2>
            <section className="flex justify-center">
              <WinrateStats games={data.total} wins={data.wins} />
            </section>
          </div>
          {data.total === 0 && (
            <div>
              {data.total === 0 && 'No recent games recorded for this combo, try another one'}
            </div>
          )}
          {data.total > 0 && (
            <>
              <section className="flex justify-between items-center m-auto w-full max-w-lg">
                <div>
                  Show only games with wins:{' '}
                  <input
                    checked={showWins}
                    type="checkbox"
                    onChange={(e) => setShowWins(e.target.checked)}
                  />
                </div>
                <div className="group p-0.5 rounded-lg flex bg-gray-100 hover:bg-gray-200 transition-colors">
                  {(['stats', 'games'] as const).map((item) => (
                    <button
                      key={item}
                      className="flex focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 rounded-md focus:outline-none focus-visible:ring-offset-gray-100"
                      onClick={() => setView(item)}
                    >
                      <span
                        className={clsx(
                          'p-1.5 lg:pl-2.5 lg:pr-2.5 rounded-md text-sm font-medium',
                          view === item && 'bg-white shadow-sm ring-1 ring-black ring-opacity-5',
                        )}
                      >
                        <span
                          className={clsx(
                            view === item
                              ? 'text-gray-900'
                              : 'text-gray-600 group-hover:text-gray-900',
                          )}
                        >
                          {capitalize(item)}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              </section>
              <section className="w-full m-auto max-w-lg overflow-x-auto xl:overflow-x-visible">
                {view === 'stats' ? (
                  <table className="w-full table-auto">
                    <thead>
                      <tr>
                        {(
                          [
                            ['Class', 'class', 'text', data.class],
                            ['Race', 'race', 'text', data.race],
                            ['God', 'god', 'text', data.god],
                            ['Games', 'total', 'numeric'],
                            ['Wins', 'wins', 'numeric'],
                            ['Win rate', 'winrate', 'numeric'],
                          ] as Array<[string, SortingKey, 'numeric' | 'text', boolean?]>
                        ).map(
                          ([title, sortingKey, type, isHidden]) =>
                            !isHidden && (
                              <th
                                key={title}
                                className={clsx(type === 'numeric' ? 'text-right' : 'text-left')}
                              >
                                <div
                                  className="whitespace-nowrap inline-flex items-center cursor-pointer select-none"
                                  onClick={() =>
                                    setSorting({
                                      key: sortingKey,
                                      direction:
                                        sorting.key === sortingKey
                                          ? sorting.direction === 'desc'
                                            ? 'asc'
                                            : 'desc'
                                          : sorting.direction,
                                    })
                                  }
                                >
                                  {title}

                                  {sorting.key === sortingKey && (
                                    <button>
                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className={clsx(
                                          'h-5 w-5 transition-transform',
                                          sorting.direction === 'asc' ? 'rotate-180' : '',
                                        )}
                                        viewBox="0 0 20 20"
                                        fill="currentColor"
                                      >
                                        <path
                                          fillRule="evenodd"
                                          d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                          clipRule="evenodd"
                                        />
                                      </svg>
                                    </button>
                                  )}
                                </div>
                              </th>
                            ),
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {flow(
                        () => normalizeData(data),
                        (x) =>
                          orderBy(
                            x,
                            (x) => {
                              const data = x[sorting.key];

                              return typeof data === 'number' ? data : data?.name.toLowerCase();
                            },
                            sorting.direction,
                          ),
                        (x) => x.filter((item) => !showWins || item.wins > 0),
                        (x) =>
                          x.map((item, index) => {
                            return (
                              <tr key={index} className="hover:bg-yellow-100">
                                {!data.race && <td>{item.race?.name}</td>}
                                {!data.class && <td>{item.class?.name}</td>}
                                {!data.god && <td>{item.god ? `${item.god.name}` : 'Atheist'}</td>}
                                <td className="text-right">{item.total}</td>
                                <td className="text-right">{item.wins}</td>
                                <td className="text-right">
                                  {formatNumber(item.winrate, {
                                    maximumFractionDigits: 2,
                                    minimumFractionDigits: 2,
                                  })}{' '}
                                  %
                                </td>
                              </tr>
                            );
                          }),
                      )()}
                    </tbody>
                  </table>
                ) : (
                  <GamesList
                    includePlayer
                    initialTotal={0}
                    isWin={showWins || undefined}
                    race={data.race?.abbr}
                    class={data.class?.abbr}
                    god={data.god?.name}
                    version={['0.27', '0.28']}
                  />
                )}
              </section>
            </>
          )}
        </>
      )}
    </div>
  );
};

type Props = Response;

type Response = {
  races: Race[];
  classes: Class[];
  gods: God[];
};

export const getStaticProps: GetStaticProps<Props> = async () => {
  const { data } = await createServerApi().api.get<Response>('/combos');

  return {
    revalidate: 300,
    props: data,
  };
};

export default SuggestPage;
