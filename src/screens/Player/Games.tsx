import { useState } from 'react';
import { Class, Race } from '@types';
import { GamesList } from '../../components/GamesList';
import { Props } from './index';

enum Filter {
  All = 'all',
  Wins = 'wins',
}

export const Games = ({
  lastGames,
  stats,
  player,
  allActualRaces,
  allActualClasses,
}: Props & { allActualRaces: Race[]; allActualClasses: Class[] }) => {
  const [games, setGames] = useState(lastGames);
  const [filter, setFilter] = useState(() => ({
    isWin: Filter.All,
    race: Filter.All,
    class: Filter.All,
  }));

  const changeFilter = (key: keyof typeof filter, value: string) => {
    setFilter((current) => ({ ...current, [key]: value }));
  };

  return (
    <section className="space-y-1 relative pb-8">
      <h2 className="font-bold">
        Recent games
        {games.length > 0 &&
          filter.isWin === Filter.All &&
          ` (${games.length}G/${games.filter((g) => g.isWin).length}W)`}
        :
      </h2>
      <div className="flex justify-between items-center text-sm">
        <label>
          Show:{' '}
          <select
            className="rounded p-1 bg-gray-100"
            value={filter.isWin}
            onChange={(e) => changeFilter('isWin', e.target.value)}
          >
            <option value={Filter.All}>all games</option>
            <option value={Filter.Wins}>only wins</option>
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
      </div>
      <GamesList
        initialGames={lastGames}
        initialTotal={stats.total.games}
        playerName={player.name}
        isWin={filter.isWin === Filter.Wins || undefined}
        race={filter.race === Filter.All ? undefined : filter.race}
        class={filter.class === Filter.All ? undefined : filter.class}
        onChange={setGames}
      />
    </section>
  );
};
