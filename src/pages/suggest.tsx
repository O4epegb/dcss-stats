import { useState, useEffect, useMemo } from 'react';
import clsx from 'clsx';
import { GetStaticProps } from 'next';
import { capitalize, map, orderBy, some } from 'lodash-es';
import { api } from '@api';
import { formatNumber } from '@utils';
import { Class, God, Race } from '@types';
import refreshSvg from '@refresh.svg';
import Tippy from '@tippyjs/react';
import { createServerApi } from '@api/server';
import { Logo } from '@components/Logo';
import { GamesList } from '@components/GamesList';
import 'tippy.js/dist/tippy.css';

enum Filter {
  Any = 'any',
}

type Stats = { wins: number; total: number };
type Combos = Record<string, Stats>;
type SuggestResponse = Stats & { combos: Combos };

const SuggestPage = (props: Props) => {
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
  const [data, setData] = useState<
    null | (SuggestResponse & { race?: Race; class?: Class; god?: God })
  >(null);
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
      <div className="w-full m-auto max-w-md bg-blue-100 rounded px-2 py-1 text-sm">
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
      <div className="w-full m-auto max-w-md flex justify-evenly items-center gap-2">
        <Tippy
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
            {isLoading && (
              <div
                className="w-5 h-5 animate-spin"
                style={{ backgroundImage: `url(${refreshSvg.src})` }}
              />
            )}
          </button>
        </Tippy>
        {/* <button className="rounded px-4 py-2 text-gray-400 border border-transparent hover:border-gray-200 transition-colors">
          Or try random
        </button> */}
      </div>

      {data && (
        <>
          <div className="m-auto w-full max-w-md space-y-2">
            <hr />
            <h2 className="text-center text-xl">
              {data.race?.name || 'Something'} {data.class?.name || 'Something'}{' '}
              <span className="font-light">of</span> {data.god?.name || 'Something'}
            </h2>
            <section className="flex space-x-4 text-xl font-bold justify-center">
              <div className="text-blue-600 whitespace-nowrap">{formatNumber(data.total)}G</div>
              <div className="text-green-600 whitespace-nowrap">{formatNumber(data.wins)}W</div>
              <div className="text-pink-600 whitespace-nowrap">
                {formatNumber((data.wins / (data.total || 1)) * 100, { maximumFractionDigits: 2 })}%
                WR
              </div>
            </section>
          </div>
          {data.total === 0 && (
            <div>
              {data.total === 0 && 'No recent games recorded for this combo, try another one'}
            </div>
          )}
          {data.total > 0 && (
            <>
              <section className="flex justify-between items-center m-auto w-full max-w-md">
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
              <section className="w-full m-auto max-w-md overflow-x-auto xl:overflow-x-visible">
                {view === 'stats' ? (
                  <table className="w-full table-auto">
                    <thead>
                      <tr>
                        {[!data.class && 'Class', !data.race && 'Race', !data.god && 'God']
                          .filter(Boolean)
                          .map((name, index) => (
                            <th key={index} className="text-left">
                              {name}
                            </th>
                          ))}
                        <th className="text-right">Games</th>
                        <th className="text-right">Wins</th>
                        <th className="text-right whitespace-nowrap">Win rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orderBy(
                        map(data.combos, (value, key) => {
                          const [raceAbbr, classAbbr, godName] = key.split(',');

                          return {
                            ...value,
                            race: data.race || races.find((x) => x.abbr === raceAbbr),
                            class: data.class || classes.find((x) => x.abbr === classAbbr),
                            god: data.god || gods.find((x) => x.name === godName),
                          };
                        }),
                        (x) => x.total,
                        'desc',
                      )
                        .filter((item) => !showWins || item.wins > 0)
                        .map((item, index) => {
                          return (
                            <tr key={index} className="hover:bg-yellow-100">
                              {!data.race && <td>{item.race?.name}</td>}
                              {!data.class && <td>{item.class?.name}</td>}
                              {!data.god && <td>{item.god ? `${item.god.name}` : 'Atheist'}</td>}
                              <td className="text-right">{item.total}</td>
                              <td className="text-right">{item.wins}</td>
                              <td className="text-right">
                                {formatNumber((item.wins / item.total) * 100, {
                                  maximumFractionDigits: 2,
                                  minimumFractionDigits: 2,
                                })}
                                %
                              </td>
                            </tr>
                          );
                        })}
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
  const res = await createServerApi().api.get<Response>('/combos');

  return {
    revalidate: 300,
    props: res.data,
  };
};

export default SuggestPage;
