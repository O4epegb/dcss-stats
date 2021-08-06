import clsx from 'clsx';
import { useEffect, useRef, Fragment, useState } from 'react';
import useMedia from 'react-use/lib/useMedia';
import { CharStat, Class, Race } from '@types';
import refreshSvg from '@refresh.svg';
import Tippy from '@tippyjs/react';
import { Summary } from './utils';
import { Props } from './index';

const items = [
  ['wins', 'wins'],
  ['games', 'games'],
  ['best XL', 'maxXl'],
] as const;

export const Matrix = ({
  summary,
  isLoading,
  allActualRaces,
  allActualClasses,
}: Props & {
  summary: Summary;
  isLoading: boolean;
  allActualRaces: Race[];
  allActualClasses: Class[];
}) => {
  const isWide = useMedia('(min-width: 1280px)');
  const [isSticky, setIsSticky] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const [[activeRace, activeClass], setActive] = useState<string[]>([]);
  const [category, setCategory] = useState<keyof CharStat>('wins');
  const tippyRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const shouldBeSticky = isWide && ref.current && window.innerHeight > ref.current?.offsetHeight;
    setIsSticky(Boolean(shouldBeSticky));
  }, [isWide, ref.current, isLoading]);

  const activeCombo = activeRace + activeClass;

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
                category === key ? 'bg-yellow-700 text-white' : 'bg-gray-100',
              )}
              onClick={() => setCategory(key)}
            >
              {name}
            </button>
          </Fragment>
        ))}
      </div>
      <div className="overflow-x-auto xl:overflow-x-visible relative">
        {isLoading && (
          <div className="w-full h-full absolute flex items-center justify-center bg-white/80">
            <div
              className="w-5 h-5 animate-spin"
              style={{ backgroundImage: `url(${refreshSvg.src})` }}
            />
          </div>
        )}

        {activeClass && activeRace && (
          <Tippy
            reference={tippyRef.current}
            content={
              <div className="space-y-2">
                <div>
                  {allActualRaces.find((x) => x.abbr === activeRace)?.name}{' '}
                  {allActualClasses.find((x) => x.abbr === activeClass)?.name}
                </div>
                {summary.combos[activeCombo]?.games > 0 ? (
                  <div className="grid gap-x-2 grid-cols-2">
                    <div>Games: {summary.combos[activeCombo]?.games}</div>
                    <div className="text-right">
                      Win rate: {summary.combos[activeCombo]?.winRate * 100}%
                    </div>
                    <div>Wins: {summary.combos[activeCombo]?.wins}</div>
                    <div className="text-right">Max XL: {summary.combos[activeCombo]?.maxXl}</div>
                  </div>
                ) : (
                  <div>No data yet</div>
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
                    activeClass === klass.abbr && 'bg-yellow-100',
                    !klass.trunk && 'text-gray-400',
                  )}
                  onMouseEnter={() => setActive(['', klass.abbr])}
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
              {allActualClasses.map((klass) => (
                <td
                  key={klass.abbr}
                  className={clsx(
                    activeClass === klass.abbr && 'bg-yellow-100',
                    summary.classes[klass.abbr]?.wins > 0 && 'text-yellow-600',
                  )}
                  onMouseEnter={() => setActive(['', klass.abbr])}
                  onMouseLeave={() => setActive([])}
                >
                  {summary.classes[klass.abbr]?.[category] || '-'}
                </td>
              ))}
            </tr>
            {allActualRaces.map((race) => (
              <tr key={race.abbr} className="h-[24px]">
                <td
                  className={clsx(
                    'text-left font-bold',
                    activeRace === race.abbr && 'bg-yellow-100',
                    !race.trunk && 'text-gray-400',
                  )}
                  onMouseEnter={() => setActive([race.abbr])}
                  onMouseLeave={() => setActive([])}
                >
                  {race.abbr}
                </td>
                <td
                  className={clsx(
                    activeRace === race.abbr && 'bg-yellow-100',
                    summary.races[race.abbr]?.wins > 0 && 'text-yellow-600',
                  )}
                  onMouseEnter={() => setActive([race.abbr])}
                  onMouseLeave={() => setActive([])}
                >
                  {summary.races[race.abbr]?.[category] || '-'}
                </td>
                {allActualClasses.map((klass) => {
                  const char = race.abbr + klass.abbr;

                  return (
                    <td
                      key={char}
                      className={clsx(
                        'border',
                        (activeClass === klass.abbr || activeRace === race.abbr) && 'bg-yellow-100',
                        summary.races[race.abbr]?.wins > 0 &&
                          summary.classes[klass.abbr]?.wins > 0 &&
                          'text-yellow-600',
                      )}
                      onMouseEnter={(e) => {
                        tippyRef.current = e.currentTarget;

                        setActive([race.abbr, klass.abbr]);
                      }}
                      onMouseLeave={() => setActive([])}
                    >
                      {summary.combos[char]?.[category] || false}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
