import clsx from 'clsx';
import { orderBy } from 'lodash-es';
import { useEffect, useRef, Fragment, useMemo, useState } from 'react';
import useMedia from 'react-use/lib/useMedia';
import { Matrix as MatrixType, Summary } from '@types';
import refreshSvg from '@refresh.svg';
import { Props } from './index';

const items = [
  ['wins', 'wins'],
  ['games', 'games'],
  ['best XL', 'maxXl'],
] as const;

export const Matrix = ({
  classes,
  races,
  matrix,
  summary,
  isLoading,
}: Props & { summary: Summary; isLoading: boolean; matrix: MatrixType }) => {
  const isWide = useMedia('(min-width: 1280px)');
  const [isSticky, setIsSticky] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const [[activeRace, activeClass], setActive] = useState<string[]>([]);
  const [category, setCategory] = useState<keyof typeof matrix[string]>('wins');
  const orderedClasses = useMemo(() => orderBy(classes, (x) => x.abbr), [classes]);
  const orderedRaces = useMemo(() => orderBy(races, (x) => x.abbr), [races]);

  useEffect(() => {
    const shouldBeSticky = isWide && ref.current && window.innerHeight > ref.current?.offsetHeight;
    setIsSticky(Boolean(shouldBeSticky));
  }, [isWide]);

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
        :
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
        <table className="w-auto xl:w-full min-w-full text-center border-collapse text-sm 2xl:text-base">
          <thead>
            <tr>
              <th className="min-w-[24px]"></th>
              <th className="min-w-[24px]"></th>
              {orderedClasses.map((klass) => (
                <th
                  key={klass.abbr}
                  className={clsx(
                    'whitespace-nowrap min-w-[24px]',
                    activeClass === klass.abbr && 'bg-yellow-100',
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
              {orderedClasses.map((klass) => (
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
            {orderedRaces.map((race) => (
              <tr key={race.abbr} className="h-[24px]">
                <td
                  className={clsx(
                    'text-left font-bold',
                    activeRace === race.abbr && 'bg-yellow-100',
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
                {orderedClasses.map((klass) => {
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
                      onMouseEnter={() => setActive([race.abbr, klass.abbr])}
                      onMouseLeave={() => setActive([])}
                    >
                      {matrix[char]?.[category] || false}
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
