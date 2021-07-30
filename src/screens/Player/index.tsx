import Link from 'next/link';
import { Response } from '@types';
import { addS, date, formatDuration, formatNumber, roundAndFormat } from '@utils';
import { useSlicedList } from '@hooks/useSlicedList';
import { Matrix } from './Matrix';

import { Games } from './Games';

export type Props = Response;

const Item = ({ title, text }: { title: string; text: string }) => (
  <li>
    <span className="font-semibold">{title}:</span> {text}
  </li>
);

export const Player = (props: Props) => {
  const { items, showAll, hasMore, extraItemsCount, toggleShowAll } = useSlicedList(
    props.titles,
    10,
  );
  const { stats } = props;
  const winrate = formatNumber((stats.total.wins / stats.total.games) * 100, {
    maximumFractionDigits: 2,
  });

  return (
    <div className="container mx-auto px-4">
      <div className="grid xl:grid-cols-3 gap-4">
        <div className="min-w-0">
          <h1 className="text-4xl pt-4 pb-2">
            <Link href="/">
              <a>DCSS Stats</a>
            </Link>
          </h1>
          <div className="space-y-2">
            <section className="space-y-2">
              <h2 className="text-3xl font-bold">{props.player.name}</h2>
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
                  ['First game', date(props.firstGame.endAt).format('DD MMM YYYY, HH:mm:ss')],
                  ['Most recent game', date(props.lastGame.endAt).format('DD MMM YYYY, HH:mm:ss')],
                ].map(([title, text]) => (
                  <Item key={title} title={title} text={text} />
                ))}
              </ul>

              {items.length > 0 && (
                <div className="space-y-1">
                  <h2 className="font-bold">
                    Collected {props.titles.length} {addS('title', props.titles.length)}:
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
          <Matrix {...props} />
        </div>
      </div>
    </div>
  );
};
