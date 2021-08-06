import { keys, orderBy, uniqBy } from 'lodash-es';
import { useEffect, useMemo, useState } from 'react';
import { api } from '@api';
import { CharStat, Matrix as MatrixType, Race, Response } from '@types';
import { addS, date, formatDuration, formatNumber, roundAndFormat } from '@utils';
import Tippy from '@tippyjs/react';
import { useSlicedList } from '@hooks/useSlicedList';
import { Logo } from '@components/Logo';
import { Matrix } from './Matrix';
import { Games } from './Games';
import { getSummary } from './utils';
import 'tippy.js/dist/tippy.css';

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

  const summary = useMemo(() => getSummary(matrix), [matrix]);

  const trunkRaces = useMemo(() => races.filter((x) => x.trunk), [races]);
  const trunkClasses = useMemo(() => classes.filter((x) => x.trunk), [classes]);

  const allActualRaces = useMemo(() => getList(trunkRaces, summary.races), [trunkRaces, summary]);
  const allActualClasses = useMemo(
    () => getList(trunkClasses, summary.classes),
    [trunkClasses, summary],
  );

  const isGreat = useMemo(
    () => trunkRaces.every((x) => summary.races[x.abbr]?.wins > 0),
    [trunkRaces, summary],
  );
  const isGreater = useMemo(
    () => trunkClasses.every((x) => summary.classes[x.abbr]?.wins > 0),
    [trunkClasses, summary],
  );

  const isGreatest = isGreat && isGreater;

  return (
    <div className="container mx-auto px-4">
      <div className="grid xl:grid-cols-3 gap-4">
        <div className="min-w-0">
          <header className="pt-4 pb-2">
            <Logo />
          </header>
          <div className="space-y-2">
            <section className="flex flex-wrap gap-x-4 gap-y-1 items-center">
              <h2 className="text-3xl font-bold">{player.name}</h2>

              {!isLoading && (
                <>
                  {isGreatest ? (
                    <Tippy content="Has won with all races and all classes">
                      <div className="text-sm rounded py-0.5 px-1 bg-yellow-300 border-2 border-yellow-600">
                        Greatest Player
                      </div>
                    </Tippy>
                  ) : (
                    <>
                      {isGreat && !isGreater && (
                        <Tippy content="Has won with all races">
                          <div className="text-sm rounded py-0.5 px-1 bg-yellow-300">
                            Great Player
                          </div>
                        </Tippy>
                      )}
                      {isGreater && !isGreat && (
                        <Tippy content="Has won with all classes">
                          <div className="text-sm rounded py-0.5 px-1 bg-yellow-300">
                            Greater Player
                          </div>
                        </Tippy>
                      )}
                    </>
                  )}
                </>
              )}
            </section>
            <section className="space-y-2">
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
                          className="text-blue-300 text-sm px-1 py-0.5 hover:underline"
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

            <Games {...props} allActualRaces={allActualRaces} allActualClasses={allActualClasses} />
          </div>
        </div>
        <div className="xl:col-span-2 min-w-0">
          <Matrix
            {...props}
            isLoading={isLoading}
            summary={summary}
            allActualRaces={allActualRaces}
            allActualClasses={allActualClasses}
          />
        </div>
      </div>
    </div>
  );
};

const getList = (trunkItems: Race[], summaryItems: Record<string, CharStat>) =>
  orderBy(
    uniqBy(
      [...trunkItems, ...keys(summaryItems).map((abbr) => ({ trunk: false, abbr, name: abbr }))],
      (x) => x.abbr,
    ),
    (x) => x.abbr,
  );
