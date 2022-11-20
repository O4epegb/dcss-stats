import { useState, useEffect, useMemo } from 'react';
import clsx from 'clsx';
import { GetStaticProps } from 'next';
import {
  capitalize,
  flow,
  map,
  orderBy,
  every,
  castArray,
  pickBy,
  groupBy,
  noop,
  omit,
  filter as _filter,
} from 'lodash-es';
import { useRouter } from 'next/router';
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
type Data = SuggestResponse & { race?: Race; class?: Class; god?: God; version?: string };

const SuggestPage = (props: Props) => {
  type SortingKey = keyof ReturnType<typeof normalizeData>[number];

  const router = useRouter();

  const versions = props.versions;
  const allRaces = props.races;
  const allClasses = props.classes;
  const allGods = props.gods;
  const races = useMemo(() => props.races.filter((x) => x.trunk), []);
  const classes = useMemo(() => props.classes.filter((x) => x.trunk), []);
  const gods = props.gods;

  const [isLoading, setIsLoading] = useState(false);
  const [showWins, setShowWins] = useState(true);
  const [view, setView] = useState<'stats' | 'games'>('stats');
  const [sorting, setSorting] = useState<{ key: SortingKey; direction: 'desc' | 'asc' }>(() => ({
    key: 'total',
    direction: 'desc',
  }));
  const [data, setData] = useState<null | Data>(null);
  const [filter, setFilter] = useState(() => ({
    race: Filter.Any as string,
    class: Filter.Any as string,
    god: Filter.Any as string,
    version: versions[0],
  }));
  const [groupingKey, setGroupingKey] = useState<keyof Omit<typeof filter, 'version'>>();

  const changeFilter = (key: keyof typeof filter, value: string) => {
    setFilter((current) => ({ ...current, [key]: value }));
  };

  const somethingSelected = _filter(filter, (value) => value !== Filter.Any).length > 1;
  const buttonEnabled = !isLoading && somethingSelected;

  useEffect(() => {
    const [qRace, qClass, qGod, qVersion] = [
      router.query.race,
      router.query.class,
      router.query.god,
      router.query.version,
    ].map((x) => castArray(x)[0]);

    const race = races.find((x) => x.name === qRace);
    const klass = classes.find((x) => x.name === qClass);
    const god = gods.find((x) => x.name === qGod);
    const version = versions.find((x) => x === qVersion);

    const somethingInvalid = [
      [qRace, race],
      [qClass, klass],
      [qGod, god],
      [qVersion, version],
    ].some(([qItem, item]) => qItem && !item);

    if (somethingInvalid) {
      router.replace({
        query: {},
      });

      return;
    }

    const newFilter = {
      race: race?.name || Filter.Any,
      class: klass?.name || Filter.Any,
      god: god?.name || Filter.Any,
      version: version || versions[0],
    } as const;

    setFilter(newFilter);

    const selected = {
      race,
      class: klass,
      god,
      version,
    };

    if (every(omit(newFilter, 'version'), (value) => value === Filter.Any) || isLoading) {
      return;
    }

    setIsLoading(true);

    api
      .get<SuggestResponse>('/suggest', {
        params: {
          race: selected.race?.abbr,
          class: selected.class?.abbr,
          god: selected.god?.name,
          version: selected.version,
        },
      })
      .then((res) => {
        setData({ ...res.data, ...selected });

        const onlyOneFilterWasSelected =
          [selected.race, selected.class, selected.god].filter((x) => x !== undefined).length === 1;

        if (!onlyOneFilterWasSelected || (groupingKey && selected[groupingKey])) {
          setGroupingKey(undefined);
        }
      })
      .catch((e) => {
        alert('Error while loading data');

        throw e;
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [router.query]);

  const normalizeData = ({ combos, race, class: klass, god }: Data) => {
    let data = map(combos, (value, key) => {
      const [raceAbbr, classAbbr, godName] = key.split(',');

      return {
        ...value,
        race: race || allRaces.find((x) => x.abbr === raceAbbr),
        class: klass || allClasses.find((x) => x.abbr === classAbbr),
        god: god || allGods.find((x) => x.name === godName),
        winrate: (value.wins / value.total) * 100,
      };
    });

    if (groupingKey) {
      const grouped = groupBy(data, (x) => x[groupingKey]?.name);
      data = map(grouped, (items) => {
        return items.reduce((acc, item) => {
          const wins = acc.wins + item.wins;
          const total = acc.total + item.total;
          const winrate = (wins / total || 0) * 100;

          return {
            ...acc,
            wins,
            total,
            winrate,
          };
        });
      });
    }

    return data;
  };

  const onlyOneFilterWasSelected =
    data && [data.race, data.class, data.god].filter((x) => x !== undefined).length === 1;

  const columns =
    data &&
    ([
      ['Race', 'race', 'text', data.race || (groupingKey && groupingKey !== 'race')],
      ['Class', 'class', 'text', data.class || (groupingKey && groupingKey !== 'class')],
      ['God', 'god', 'text', data.god || (groupingKey && groupingKey !== 'god')],
      ['Games', 'total', 'numeric'],
      ['Wins', 'wins', 'numeric'],
      ['Win rate', 'winrate', 'numeric'],
    ] as Array<[string, SortingKey, 'numeric' | 'text', boolean?]>);

  return (
    <div
      className={clsx(
        'container mx-auto flex min-h-screen flex-col items-center space-y-4 px-4 pt-8 pb-8',
        !data && 'md:justify-center md:pt-0',
      )}
    >
      <header>
        <Logo />
      </header>
      <div className="m-auto w-full max-w-md rounded bg-blue-100 px-2 py-1 text-sm">
        <span className="font-semibold">TL;DR:</span> pick race, class, or god that you want to play
        (or any combination of them). Hit the button to see win rate of your combo, as well as games
        of other players.
        <br />
        <br />
        This tool in under development, with bugs and suggestions DM @totalnoob on{' '}
        <a
          href="https://discord.gg/pKCNTunFeW"
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
        >
          RL Discord
        </a>
      </div>
      <div className="flex w-full flex-wrap gap-2 md:justify-center">
        I want to play
        <select
          className="rounded bg-gray-100 p-1 transition-colors hover:bg-gray-200"
          value={filter.race}
          onChange={(e) => changeFilter('race', e.target.value)}
        >
          <option value={Filter.Any}>any race</option>
          {races.map(({ name }) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
        <select
          className="rounded bg-gray-100 p-1 transition-colors hover:bg-gray-200"
          value={filter.class}
          onChange={(e) => changeFilter('class', e.target.value)}
        >
          <option value={Filter.Any}>some class</option>
          {classes.map(({ name }) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
        and
        <select
          className="rounded bg-gray-100 p-1 transition-colors hover:bg-gray-200"
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
      <div className="m-auto flex w-full max-w-lg items-center justify-center gap-2">
        <Tooltip disabled={somethingSelected} content="Select at least one option above">
          <button
            type="button"
            className={clsx(
              'flex items-center gap-x-2 rounded border bg-gray-800 px-4 py-2 text-white transition-colors',
              buttonEnabled && 'hover:bg-gray-700',
            )}
            onClick={() => {
              if (buttonEnabled) {
                router.replace({
                  query: pickBy(
                    {
                      race: filter.race,
                      class: filter.class,
                      god: filter.god,
                      version: filter.version,
                    },
                    (value) => value !== Filter.Any,
                  ),
                });
              }
            }}
          >
            Time to have some fun!
            {isLoading && <Loader />}
          </button>
        </Tooltip>

        <select
          className="rounded bg-gray-100 p-1 transition-colors hover:bg-gray-200"
          value={filter.version}
          onChange={(e) => changeFilter('version', e.target.value)}
        >
          {versions.map((version) => (
            <option key={version} value={version}>
              v{version}
            </option>
          ))}
        </select>
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
              {data.total === 0 && 'No games recorded for this combination, try another one'}
            </div>
          )}
          {data.total > 0 && columns && (
            <>
              <section className="m-auto flex w-full max-w-lg flex-wrap items-center justify-between">
                {view === 'stats' && onlyOneFilterWasSelected && (
                  <div className="flex w-full gap-4">
                    {(['race', 'class', 'god'] as const).map(
                      (key) =>
                        !data[key] && (
                          <label
                            key={key}
                            className={clsx('flex cursor-pointer items-center gap-1')}
                          >
                            <input
                              type="radio"
                              className="cursor-pointer"
                              checked={groupingKey === key}
                              onChange={noop}
                              onClick={() => setGroupingKey((x) => (x === key ? undefined : key))}
                            />
                            Group by {key}
                          </label>
                        ),
                    )}
                  </div>
                )}
                <label className="flex cursor-pointer items-center gap-1">
                  <input
                    checked={showWins}
                    className="cursor-pointer"
                    type="checkbox"
                    onChange={(e) => setShowWins(e.target.checked)}
                  />
                  Show only games with wins
                </label>
                <div className="group flex rounded-lg bg-gray-100 p-0.5 transition-colors hover:bg-gray-200">
                  {(['stats', 'games'] as const).map((item) => (
                    <button
                      key={item}
                      className="flex rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-100"
                      onClick={() => setView(item)}
                    >
                      <span
                        className={clsx(
                          'rounded-md p-1.5 text-sm font-medium lg:pl-2.5 lg:pr-2.5',
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
              <section className="m-auto w-full max-w-lg overflow-x-auto xl:overflow-x-visible">
                {view === 'stats' ? (
                  <table className="w-full table-auto">
                    <thead>
                      <tr>
                        {columns.map(
                          ([title, sortingKey, type, isHidden]) =>
                            !isHidden && (
                              <th
                                key={title}
                                className={clsx(type === 'numeric' ? 'text-right' : 'text-left')}
                              >
                                <div
                                  className="inline-flex cursor-pointer select-none items-center whitespace-nowrap"
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
                              <tr key={index} className="hover:bg-amber-100">
                                {!columns[0][3] && <td>{item.race?.name}</td>}
                                {!columns[1][3] && <td>{item.class?.name}</td>}
                                {!columns[2][3] && (
                                  <td>{item.god ? `${item.god.name}` : 'Atheist'}</td>
                                )}
                                <td className="text-right tabular-nums">{item.total}</td>
                                <td className="text-right tabular-nums">{item.wins}</td>
                                <td className="text-right tabular-nums">
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
                    showSkills
                    orderBy="endAt"
                    initialTotal={0}
                    isWin={showWins || undefined}
                    race={data.race?.abbr}
                    class={data.class?.abbr}
                    god={data.god?.name}
                    version={data.version ? [data.version] : []}
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
  versions: string[];
};

export const getStaticProps: GetStaticProps<Props> = async () => {
  const { data } = await createServerApi().api.get<Response>('/combos');

  return {
    revalidate: 300,
    props: {
      races: orderBy(data.races, (x) => x.name),
      classes: orderBy(data.classes, (x) => x.name),
      gods: orderBy(data.gods, (x) => x.name.toLowerCase()),
      versions: data.versions,
    },
  };
};

export default SuggestPage;
