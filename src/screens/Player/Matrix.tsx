import clsx from 'clsx';
import { useEffect, useRef, Fragment, useState } from 'react';
import useMedia from 'react-use/lib/useMedia';
import { CharStat } from '@types';
import { addS, formatNumber } from '@utils';
import { Tooltip } from '@components/Tooltip';
import { Summary, unavailableCombos } from './utils';

const items = [
  ['wins', 'wins'],
  ['games', 'games'],
  ['win rate %', 'winRate'],
  ['best XL', 'maxXl'],
  ['first win', 'gamesToFirstWin'],
] as const;

export const Matrix = ({ summary }: { summary: Summary }) => {
  const isWide = useMedia('(min-width: 1280px)', false);
  const [isSticky, setIsSticky] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const [[activeRace, activeClass], setActive] = useState<string[]>([]);
  const [category, setCategory] = useState<keyof CharStat>('wins');
  const tippyRef = useRef<HTMLElement | null>(null);
  const { stats, allActualRaces, allActualClasses, greatRaces, greatClasses } = summary;

  useEffect(() => {
    const shouldBeSticky = isWide && ref.current && window.innerHeight > ref.current?.offsetHeight;
    setIsSticky(Boolean(shouldBeSticky));
  }, [isWide, ref.current]);

  const formatter = (value: number) =>
    category === 'winRate'
      ? formatNumber(value * 100, { maximumFractionDigits: 0 })
      : String(value);

  const activeCombo = (activeRace || '') + (activeClass || '');
  const tooltipStats =
    stats[!activeRace ? 'classes' : !activeClass ? 'races' : 'combos'][activeCombo];

  return (
    <div ref={ref} className={clsx('w-full', isSticky && 'sticky top-0')}>
      <div className="py-6">
        <span className="font-medium">Matrix</span> by
        {items.map(([name, key]) => (
          <Fragment key={key}>
            {' '}
            <button
              className={clsx(
                'rounded px-2 py-0.5 font-light',
                category === key ? 'bg-amber-700 text-white' : 'bg-gray-100',
              )}
              onClick={() => setCategory(key)}
            >
              {name}
            </button>
          </Fragment>
        ))}
      </div>
      <div className="overflow-x-auto xl:overflow-x-visible relative">
        {(activeClass || activeRace) && (
          <Tooltip
            reference={tippyRef.current}
            content={
              <div className="space-y-2">
                <div>
                  <span className={clsx(greatRaces[activeRace] && 'text-amber-300')}>
                    {greatRaces[activeRace] && !activeClass && 'Great '}
                    {allActualRaces.find((x) => x.abbr === activeRace)?.name}
                  </span>{' '}
                  <span className={clsx(greatClasses[activeClass] && 'text-amber-300')}>
                    {greatClasses[activeClass] && !activeRace && 'Great '}
                    {allActualClasses.find((x) => x.abbr === activeClass)?.name}
                  </span>
                </div>
                {tooltipStats?.games > 0 ? (
                  <div className="grid gap-x-2 grid-cols-2 font-light">
                    <div>
                      Games:{' '}
                      <span className="font-medium">{formatNumber(tooltipStats?.games)}</span>
                    </div>
                    <div className="text-right">
                      Win rate:{' '}
                      <span className="font-medium">
                        {formatNumber(tooltipStats?.winRate * 100, {
                          maximumFractionDigits: 2,
                        })}
                        %
                      </span>
                    </div>
                    <div>
                      Wins: <span className="font-medium">{tooltipStats?.wins}</span>
                    </div>
                    <div className="text-right">
                      Max XL: <span className="font-medium">{tooltipStats?.maxXl}</span>
                    </div>
                    {tooltipStats.gamesToFirstWin > 0 && (
                      <div className="col-span-full">
                        First win after{' '}
                        <span className="font-medium">{tooltipStats.gamesToFirstWin}</span>{' '}
                        {addS('game', tooltipStats.gamesToFirstWin)}
                      </div>
                    )}
                  </div>
                ) : (
                  !unavailableCombos[activeCombo] && <div>No data yet</div>
                )}
                {unavailableCombos[activeCombo] && <div>Combo is not playable</div>}
                {!(activeRace && activeClass) &&
                  (greatClasses[activeClass] || greatRaces[activeRace]) && (
                    <div className="text-xs">
                      Great — won all possible combos with {activeRace ? 'race' : 'class'}
                    </div>
                  )}
              </div>
            }
          />
        )}

        <table className="w-auto xl:w-full min-w-full text-center border-collapse text-sm 2xl:text-base">
          <thead>
            <tr>
              <th className="min-w-[24px]"></th>
              <th className="min-w-[24px]"></th>
              {allActualClasses.map((klass) => (
                <th
                  key={klass.abbr}
                  className={clsx(
                    'whitespace-nowrap min-w-[24px]',

                    greatClasses[klass.abbr]
                      ? 'bg-amber-200'
                      : activeClass === klass.abbr && 'bg-amber-100',
                    !klass.trunk && 'text-gray-400',
                  )}
                  onMouseEnter={(e) => {
                    setActive(['', klass.abbr]);

                    tippyRef.current = e.currentTarget;
                  }}
                  onMouseLeave={() => setActive([])}
                >
                  {klass.abbr}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="h-[24px]">
              <td></td>
              <td></td>
              {allActualClasses.map((klass) => {
                const value = stats.classes[klass.abbr]?.[category];

                return (
                  <td
                    key={klass.abbr}
                    className={clsx(
                      category === 'gamesToFirstWin' &&
                        stats.classes[klass.abbr]?.gamesToFirstWin === 1
                        ? 'bg-amber-200'
                        : activeClass === klass.abbr && 'bg-amber-100',
                      stats.classes[klass.abbr]?.wins > 0 && 'text-amber-600',
                    )}
                    onMouseEnter={(e) => {
                      setActive(['', klass.abbr]);

                      tippyRef.current = e.currentTarget;
                    }}
                    onMouseLeave={() => setActive([])}
                  >
                    {value ? formatter(value) : '-'}
                  </td>
                );
              })}
            </tr>
            {allActualRaces.map((race) => {
              const value = stats.races[race.abbr]?.[category];

              return (
                <tr key={race.abbr} className="h-[24px]">
                  <td
                    className={clsx(
                      'text-left font-bold',
                      greatRaces[race.abbr]
                        ? 'bg-amber-200'
                        : activeRace === race.abbr && 'bg-amber-100',
                      !race.trunk && 'text-gray-400',
                    )}
                    onMouseEnter={(e) => {
                      setActive([race.abbr]);

                      tippyRef.current = e.currentTarget;
                    }}
                    onMouseLeave={() => setActive([])}
                  >
                    {race.abbr}
                  </td>
                  <td
                    className={clsx(
                      category === 'gamesToFirstWin' &&
                        stats.races[race.abbr]?.gamesToFirstWin === 1
                        ? 'bg-amber-200'
                        : activeRace === race.abbr && 'bg-amber-100',
                      stats.races[race.abbr]?.wins > 0 && 'text-amber-600',
                    )}
                    onMouseEnter={(e) => {
                      setActive([race.abbr]);

                      tippyRef.current = e.currentTarget;
                    }}
                    onMouseLeave={() => setActive([])}
                  >
                    {value ? formatter(value) : '-'}
                  </td>
                  {allActualClasses.map((klass) => {
                    const char = race.abbr + klass.abbr;
                    const value = stats.combos[char]?.[category];
                    const content = value ? formatter(value) : null;

                    return (
                      <td
                        key={char}
                        className={clsx(
                          'border',
                          category === 'gamesToFirstWin' &&
                            stats.combos[char]?.gamesToFirstWin === 1
                            ? 'bg-amber-200'
                            : activeClass === klass.abbr || activeRace === race.abbr
                            ? 'bg-amber-100'
                            : unavailableCombos[char] && 'bg-gray-50',
                          stats.combos[char]?.wins > 0 && 'text-amber-600',
                          content && content?.length > 2 && 'text-xs 2xl:text-sm',
                          unavailableCombos[char] && 'text-gray-200',
                        )}
                        onMouseEnter={(e) => {
                          tippyRef.current = e.currentTarget;

                          setActive([race.abbr, klass.abbr]);
                        }}
                        onMouseLeave={() => setActive([])}
                      >
                        {content || (unavailableCombos[char] && 'x')}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
