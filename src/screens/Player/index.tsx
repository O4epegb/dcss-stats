import clsx from 'clsx';
import { useMemo, useState } from 'react';
import { Response } from '@types';
import { addS, date, formatDuration, formatNumber, roundAndFormat } from '@utils';
import Tippy from '@tippyjs/react';
import { useSlicedList } from '@hooks/useSlicedList';
import { Logo } from '@components/Logo';
import { Matrix } from './Matrix';
import { Games } from './Games';
import { getSummary } from './utils';
import 'tippy.js/dist/tippy.css';

export type Props = Response;

export const Player = (props: Props) => {
  const { titles, player, firstGame, lastGame, races, classes, matrix, gods } = props;
  const [
    isLoading,
    // , setIsLoading
  ] = useState(false);
  // const [matrix, setMatrix] = useState<MatrixType>({});
  // const [gods, setGods] = useState<God[]>([]);
  const { items, showAll, hasMore, extraItemsCount, toggleShowAll } = useSlicedList(titles, 10);
  const { stats } = props;
  const winrate = formatNumber((stats.total.wins / stats.total.games) * 100, {
    maximumFractionDigits: 2,
  });

  // useEffect(() => {
  //   api
  //     .get<{ matrix: MatrixType; gods: God[] }>(`/players/${player.name}/matrix`)
  //     .then((res) => {
  //       setMatrix(res.data.matrix);
  //       setGods(res.data.gods);
  //     })
  //     .catch((e) => {
  //       alert('Error while loading matrix');

  //       throw e;
  //     })
  //     .finally(() => {
  //       setIsLoading(false);
  //     });
  // }, []);

  const summary = useMemo(() => getSummary(matrix, races, classes, gods), [matrix]);
  const {
    trunkClasses,
    trunkRaces,
    wonRaces,
    wonClasses,
    wonGods,
    notWonClasses,
    notWonGods,
    notWonRaces,
    allActualClasses,
    allActualRaces,
  } = summary;

  const isGreat = wonRaces.length === trunkRaces.length;
  const isGreater = wonClasses.length === trunkClasses.length;
  const isGreatest = isGreat && isGreater;
  const isPolytheist = wonGods.length === gods.length;

  return (
    <div className="container mx-auto px-4 grid xl:grid-cols-3 gap-4">
      <div className="min-w-0">
        <header className="pt-4 pb-2">
          <Logo />
        </header>
        <div className="space-y-2">
          <section className="flex flex-wrap gap-x-4 gap-y-1 items-center">
            <h2 className="text-3xl font-bold">{player.name}</h2>
            {!isLoading && (
              <div className="flex flex-wrap gap-2 text-sm">
                {isGreatest ? (
                  <Tippy content="Has won with all races and all classes">
                    <div className="rounded py-0.5 px-1 bg-yellow-300 ring-inset ring-2 ring-yellow-600">
                      Greatest Player
                    </div>
                  </Tippy>
                ) : (
                  <>
                    {isGreat && (
                      <Tippy content="Has won with all races">
                        <div className="rounded py-0.5 px-1 bg-yellow-300">Great Player</div>
                      </Tippy>
                    )}
                    {isGreater && (
                      <Tippy content="Has won with all classes">
                        <div className="rounded py-0.5 px-1 bg-yellow-300">Greater Player</div>
                      </Tippy>
                    )}
                  </>
                )}
                {isPolytheist && (
                  <Tippy content="Has won with all gods">
                    <div className="rounded py-0.5 px-1 bg-purple-300">Polytheist</div>
                  </Tippy>
                )}
              </div>
            )}
          </section>
          <section className="flex space-x-4 text-xl font-bold">
            <div className="text-blue-600 whitespace-nowrap">
              {formatNumber(stats.total.games)}G
            </div>
            <div className="text-green-600 whitespace-nowrap">
              {formatNumber(stats.total.wins)}W
            </div>
            <div className="text-pink-600 whitespace-nowrap">{winrate}% WR</div>
          </section>
          {(!isPolytheist || !isGreat || !isGreater) && (
            <section className="flex flex-row flex-wrap gap-2 items-start text-xs">
              {!isGreat && (
                <Badge
                  tip=""
                  title="Great Player"
                  allItems={trunkRaces}
                  playerItems={wonRaces}
                  leftToWinWith={notWonRaces}
                />
              )}
              {!isGreater && (
                <Badge
                  tip=""
                  title="Greater Player"
                  allItems={trunkClasses}
                  playerItems={wonClasses}
                  leftToWinWith={notWonClasses}
                />
              )}
              {!isPolytheist && (
                <Badge
                  tip=""
                  title="Polytheist"
                  allItems={gods}
                  playerItems={wonGods}
                  leftToWinWith={notWonGods}
                />
              )}
            </section>
          )}
          <section className="text-xs space-y-2">
            <div className="gap-2 grid grid-cols-2">
              <List
                items={[
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
                ]}
              />
              <List
                items={[
                  ['Total runes extracted', roundAndFormat(stats.total.runesWon)],
                  ['Total runes lost', roundAndFormat(stats.total.runesLost)],
                  [
                    'Average runes extracted',
                    roundAndFormat(stats.average.runesWon, { maximumFractionDigits: 1 }),
                  ],
                  ['Fastest win', stats.min.winTime ? formatDuration(stats.min.winTime) : 'n/a'],
                  ['Slowest win', stats.max.winTime ? formatDuration(stats.max.winTime) : 'n/a'],
                ]}
              />
            </div>
            <List
              items={[
                ['First game', date(firstGame.endAt).format('DD MMM YYYY, HH:mm:ss')],
                ['Most recent game', date(lastGame.endAt).format('DD MMM YYYY, HH:mm:ss')],
              ]}
            />
          </section>
          {items.length > 0 && (
            <section className="space-y-1">
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
            </section>
          )}

          <Games {...props} allActualRaces={allActualRaces} allActualClasses={allActualClasses} />
        </div>
      </div>
      <div className="xl:col-span-2 min-w-0">
        <Matrix {...props} isLoading={isLoading} summary={summary} />
      </div>
    </div>
  );
};

const List = ({ items }: { items: [string, string][] }) => (
  <ul>
    {items.map(([title, text]) => (
      <li key={title}>
        <span className="font-semibold">{title}:</span> {text}
      </li>
    ))}
  </ul>
);

const Badge = ({
  playerItems,
  allItems,
  leftToWinWith,
  title,
  tip,
  className,
}: {
  playerItems: unknown[];
  allItems: unknown[];
  leftToWinWith: Array<{ name: string }>;
  title: string;
  tip: string;
  className?: string;
}) => {
  const isDone = playerItems.length === allItems.length;

  if (isDone) {
    return (
      <Tippy content={tip}>
        <div className={clsx('rounded py-0.5 px-1', className)}>{title}</div>
      </Tippy>
    );
  }

  return (
    <Tippy
      content={
        <div className="space-y-2">
          <div>Need to win with:</div>
          <ul>
            {leftToWinWith.map((item) => (
              <li key={item.name}>{item.name}</li>
            ))}
          </ul>
        </div>
      }
    >
      <div className="rounded py-0.5 px-1 relative overflow-hidden bg-gray-100">
        <div
          className="bg-gray-200 absolute top-0 left-0 bottom-0"
          style={{
            width: `${(playerItems.length / allItems.length) * 100}%`,
          }}
        />
        <span className="z-[1] relative">
          {title} {playerItems.length} of {allItems.length}
        </span>
      </div>
    </Tippy>
  );
};
