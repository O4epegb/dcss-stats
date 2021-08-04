import { reduce } from 'lodash-es';
import { useEffect, useMemo, useState } from 'react';
import { api } from '@api';
import { Matrix as MatrixType, Response } from '@types';
import { addS, date, formatDuration, formatNumber, roundAndFormat } from '@utils';
import { useSlicedList } from '@hooks/useSlicedList';
import { Logo } from '@components/Logo';
import { Matrix } from './Matrix';
import { Games } from './Games';

export type Props = Response;

const Item = ({ title, text }: { title: string; text: string }) => (
  <li>
    <span className="font-semibold">{title}:</span> {text}
  </li>
);

export const Player = (props: Props) => {
  const { titles, player, firstGame, lastGame, races, classes } = props;
  const [isLoading, setIsLoading] = useState(true);
  const [matrix, setMatrix] = useState<MatrixType>({});
  const { items, showAll, hasMore, extraItemsCount, toggleShowAll } = useSlicedList(titles, 10);
  const { stats } = props;
  const winrate = formatNumber((stats.total.wins / stats.total.games) * 100, {
    maximumFractionDigits: 2,
  });

  useEffect(() => {
    api
      .get<{ matrix: MatrixType }>(`/players/${player.name}/matrix`)
      .then((res) => setMatrix(res.data.matrix))
      .catch((e) => {
        alert('Error while loading matrix');

        throw e;
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const summary = useMemo(
    () =>
      reduce(
        matrix,
        (acc, value, key) => {
          const race = key.slice(0, 2);
          const klass = key.slice(2, 4);

          acc.classes[klass] = {
            wins: (acc.classes[klass]?.wins || 0) + value.wins,
            games: (acc.classes[klass]?.games || 0) + value.games,
            maxXl: Math.max(acc.classes[klass]?.maxXl || 0, value.maxXl),
          };

          acc.races[race] = {
            wins: (acc.races[race]?.wins || 0) + value.wins,
            games: (acc.races[race]?.games || 0) + value.games,
            maxXl: Math.max(acc.races[race]?.maxXl || 0, value.maxXl),
          };

          return acc;
        },
        {
          races: {},
          classes: {},
        } as {
          races: Record<string, typeof matrix[string]>;
          classes: Record<string, typeof matrix[string]>;
        },
      ),
    [matrix],
  );

  const isGreat = useMemo(
    () => races.every((race) => summary.races[race.abbr]?.wins > 0),
    [summary],
  );
  const isGreater = useMemo(
    () => classes.every((klass) => summary.classes[klass.abbr]?.wins > 0),
    [summary],
  );

  return (
    <div className="container mx-auto px-4">
      <div className="grid xl:grid-cols-3 gap-4">
        <div className="min-w-0">
          <header className="pt-4 pb-2">
            <Logo />
          </header>
          <div className="space-y-2">
            <section className="space-y-2">
              <div className="flex flex-wrap gap-x-4 gap-y-2 items-center">
                <h2 className="text-3xl font-bold">{player.name}</h2>
                {!isLoading && (
                  <>
                    {isGreat && isGreater && (
                      <div className="text-sm py-0.5 px-1 bg-yellow-300 border-2 border-yellow-600">
                        Greatest Player
                      </div>
                    )}
                    {isGreat && !isGreater && (
                      <div className="text-sm py-0.5 px-1 bg-yellow-300">Great Player</div>
                    )}
                    {isGreater && !isGreat && (
                      <div className="text-sm py-0.5 px-1 bg-yellow-300">Greater Player</div>
                    )}
                  </>
                )}
              </div>

              <div className="flex space-x-4 text-xl font-bold">
                <div className="text-blue-600 whitespace-nowrap">
                  {formatNumber(stats.total.games)}G
                </div>
                <div className="text-green-600 whitespace-nowrap">
                  {formatNumber(stats.total.wins)}W
                </div>
                <div className="text-pink-600 whitespace-nowrap">{winrate}% WR</div>
              </div>

              <div className="text-xs gap-2 grid grid-cols-2">
                <ul>
                  {[
                    ['Total score', roundAndFormat(stats.total.score)],
                    ['Best score', roundAndFormat(stats.max.score)],
                    [
                      'Average score',
                      roundAndFormat(stats.average.score, { maximumFractionDigits: 0 }),
                    ],
                    [
                      'Average game time',
                      stats.average.gameTime ? formatDuration(stats.average.gameTime) : 'n/a',
                    ],
                    [
                      'Average win time',
                      stats.average.winTime ? formatDuration(stats.average.winTime) : 'n/a',
                    ],
                  ].map(([title, text]) => (
                    <Item key={title} title={title} text={text} />
                  ))}
                </ul>
                <ul>
                  {[
                    ['Total runes extracted', roundAndFormat(stats.total.runesWon)],
                    ['Total runes lost', roundAndFormat(stats.total.runesLost)],
                    [
                      'Average runes extracted',
                      roundAndFormat(stats.average.runesWon, { maximumFractionDigits: 1 }),
                    ],
                    ['Fastest win', stats.min.winTime ? formatDuration(stats.min.winTime) : 'n/a'],
                    ['Slowest win', stats.max.winTime ? formatDuration(stats.max.winTime) : 'n/a'],
                  ].map(([title, text]) => (
                    <Item key={title} title={title} text={text} />
                  ))}
                </ul>
              </div>
              <ul className="text-xs">
                {[
                  ['First game', date(firstGame.endAt).format('DD MMM YYYY, HH:mm:ss')],
                  ['Most recent game', date(lastGame.endAt).format('DD MMM YYYY, HH:mm:ss')],
                ].map(([title, text]) => (
                  <Item key={title} title={title} text={text} />
                ))}
              </ul>

              {items.length > 0 && (
                <div className="space-y-1">
                  <h2 className="font-bold">
                    Collected {titles.length} {addS('title', titles.length)}:
                  </h2>
                  <ul className="flex flex-wrap gap-1 text-sm">
                    {items.map((title) => (
                      <li key={title} className="bg-gray-600 text-white rounded px-1 py-0.5">
                        {title}
                      </li>
                    ))}
                    {hasMore && (
                      <li>
                        <button
                          className="text-blue-300 text-sm px-1 py-0.5"
                          onClick={toggleShowAll}
                        >
                          {showAll ? 'Show fewer' : `Show ${extraItemsCount} more`}
                        </button>
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </section>

            <Games {...props} />
          </div>
        </div>
        <div className="xl:col-span-2 min-w-0">
          <Matrix {...props} matrix={matrix} isLoading={isLoading} summary={summary} />
        </div>
      </div>
    </div>
  );
};
