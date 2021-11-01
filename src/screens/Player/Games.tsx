import { useMemo, useState } from 'react';
import clsx from 'clsx';
import { range, orderBy } from 'lodash-es';
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
  const { lastGames, stats, player, gods, isCompact, isFiltersOpen, toggleCompact, toggleFilters } =
    usePlayerPageContext();
  const [games, setGames] = useState(lastGames);
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

  return (
    <section className="space-y-1 relative pb-8">
      <header className="flex justify-between items-center">
        <h2 className="font-bold">
          Recent games
          {games.length > 0 &&
            filter.isWin === Filter.All &&
            ` (${games.length}G/${games.filter((g) => g.isWin).length}W)`}
          :
        </h2>
        <Tooltip content="Game list settings">
          <button
            className={clsx(
              'transition hover:text-green-500',
              showSettings ? 'text-green-600 rotate-180' : 'text-gray-400',
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
          <div className="border rounded p-2">
            <label className="inline-flex items-center gap-1">
              <input checked={isCompact} type="checkbox" onChange={toggleCompact} /> Show compact
              game list
            </label>
          </div>
        </section>
      )}
      <div className="flex justify-between items-center text-sm">
        <label>
          Show:{' '}
          <select
            className="rounded p-1 bg-gray-100"
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
        <Tooltip content="Show more filters">
          <button
            className={clsx(
              'transition-colors hover:text-green-500',
              isFiltersOpen ? 'text-green-600' : 'text-gray-400',
            )}
            onClick={toggleFilters}
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
      {isFiltersOpen && (
        <div className="flex gap-4 items-center text-sm">
          <label>
            God:{' '}
            <select
              className="rounded p-1 bg-gray-100"
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
              className="rounded p-1 bg-gray-100"
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
        isCompactView={isCompact}
        initialGames={lastGames}
        initialTotal={stats.total.games}
        playerName={player.name}
        isWin={filter.isWin === Filter.All ? undefined : Boolean(filter.isWin)}
        race={filter.race === Filter.All ? undefined : filter.race}
        class={filter.class === Filter.All ? undefined : filter.class}
        god={filter.god === Filter.All ? undefined : filter.god}
        runes={runeOptions.find((x) => x.name === filter.runes)?.value}
        onChange={setGames}
      />
    </section>
  );
};
