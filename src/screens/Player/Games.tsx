import { useMemo, useState } from 'react';
import clsx from 'clsx';
import { range, orderBy, some } from 'lodash-es';
import { Class, Race } from '@types';
import { Tooltip } from '@components/Tooltip';
import { GamesList } from '../../components/GamesList';
import { usePlayerPageContext } from './context';

enum Filter {
  All = 'all',
  Wins = '1',
  Loses = '',
}

const runeOptions = [
  {
    name: '15',
    value: [15],
  },
  {
    name: '1 to 14',
    value: range(1, 15),
  },
  ...range(0, 15).map((value) => ({ value: [value], name: String(value) })),
];

export const Games = ({
  allActualRaces,
  allActualClasses,
}: {
  allActualRaces: Race[];
  allActualClasses: Class[];
}) => {
  const { lastGames, stats, player, gods, toggleOption, isOptionEnabled } = usePlayerPageContext();
  const [data, setData] = useState(() => ({ games: lastGames, total: stats.total.games }));
  const [showSettings, setShowSettings] = useState(false);
  const sortedGods = useMemo(() => orderBy(gods, (x) => x.name.toLowerCase()), [gods]);
  const [filter, setFilter] = useState(() => ({
    isWin: Filter.All,
    race: Filter.All,
    class: Filter.All,
    god: Filter.All,
    runes: Filter.All,
  }));

  const changeFilter = (key: keyof typeof filter, value: string) => {
    setFilter((current) => ({ ...current, [key]: value }));
  };

  const isDirty = some(filter, (value) => value !== Filter.All);

  return (
    <section className="relative space-y-1 pb-8">
      <header className="flex items-center justify-between">
        <h2 className="font-bold">
          {isDirty ? 'Filtered games' : 'Recent games'}
          {data.games.length > 0 &&
            (isDirty
              ? ` (${data.total} total)`
              : ` (${data.games.length}G/${data.games.filter((g) => g.isWin).length}W)`)}
          :
        </h2>
        <Tooltip content="Game list settings">
          <button
            className={clsx(
              'transition hover:text-emerald-500',
              showSettings ? 'rotate-180 text-emerald-600' : 'text-gray-400',
            )}
            onClick={() => setShowSettings((x) => !x)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </Tooltip>
      </header>
      {showSettings && (
        <section className="py-2">
          <div className="rounded border p-2">
            <label className="inline-flex items-center gap-1">
              <input
                checked={isOptionEnabled('dcss-compact-view')}
                type="checkbox"
                onChange={() => toggleOption('dcss-compact-view')}
              />{' '}
              Show compact game list
            </label>
          </div>
        </section>
      )}
      <div className="flex items-center justify-between text-sm">
        <label>
          Show:{' '}
          <select
            className="rounded bg-gray-100 p-1"
            value={filter.isWin}
            onChange={(e) => changeFilter('isWin', e.target.value)}
          >
            <option value={Filter.All}>all games</option>
            <option value={Filter.Wins}>wins only</option>
            <option value={Filter.Loses}>loses only</option>
          </select>
        </label>
        <label>
          Race:{' '}
          <select
            className="rounded bg-gray-100 p-1"
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
            className="rounded bg-gray-100 p-1"
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
        <Tooltip content="Show more filters">
          <button
            className={clsx(
              'transition-colors hover:text-emerald-500',
              isOptionEnabled('dcss-open-filters') ? 'text-emerald-600' : 'text-gray-400',
            )}
            onClick={() => toggleOption('dcss-open-filters')}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </Tooltip>
      </div>
      {isOptionEnabled('dcss-open-filters') && (
        <div className="flex items-center gap-4 text-sm">
          <label>
            God:{' '}
            <select
              className="rounded bg-gray-100 p-1"
              value={filter.god}
              onChange={(e) => changeFilter('god', e.target.value)}
            >
              <option value={Filter.All}>any</option>
              {sortedGods.map(({ name }) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Runes:{' '}
            <select
              className="rounded bg-gray-100 p-1"
              value={filter.runes}
              onChange={(e) => changeFilter('runes', e.target.value)}
            >
              <option value={Filter.All}>any</option>
              {runeOptions.map(({ name }) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}
      <GamesList
        isCompactView={isOptionEnabled('dcss-compact-view')}
        initialGames={lastGames}
        initialTotal={stats.total.games}
        playerName={player.name}
        isWin={filter.isWin === Filter.All ? undefined : Boolean(filter.isWin)}
        race={filter.race === Filter.All ? undefined : filter.race}
        class={filter.class === Filter.All ? undefined : filter.class}
        god={filter.god === Filter.All ? undefined : filter.god}
        runes={runeOptions.find((x) => x.name === filter.runes)?.value}
        onChange={(newGames, count) => setData({ games: newGames, total: count })}
      />
    </section>
  );
};
