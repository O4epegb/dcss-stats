import { ReactNode, FC } from 'react';
import { filter } from 'lodash-es';
import { Game } from '@types';
import { pluralize, date, formatDuration, roundAndFormat } from '@utils';
import { HeadlessTooltip, Tooltip } from '@components/Tooltip';
import { GameItem } from '@components/GameItem';
import { usePlayerPageContext } from './context';
import { Summary } from './utils';

export const Stats = ({ summary }: { summary: Summary }) => {
  const { firstGame, lastGame, lowestXlWin, stats } = usePlayerPageContext();
  const {
    combosCompleted,
    totalCombos,
    stats: { combos, races, classes },
  } = summary;

  const oneAndWons = filter(combos, (value) => value.gamesToFirstWin === 1).length;
  const oneAndWonsRace = filter(races, (value) => value.gamesToFirstWin === 1).length;
  const oneAndWonsClass = filter(classes, (value) => value.gamesToFirstWin === 1).length;

  return (
    <section className="space-y-2 text-xs">
      <div className="grid grid-cols-2 gap-x-1 gap-y-2">
        <List
          items={[
            ['Total score', roundAndFormat(stats.total.score)],
            ['Best score', roundAndFormat(stats.max.score)],
            ['Average score', roundAndFormat(stats.average.score, { maximumFractionDigits: 0 })],
            ['Combos completed', `${combosCompleted} of ${totalCombos}`],
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
            [
              <Tooltip
                key=""
                content={
                  <div className="space-y-2">
                    <div>One-and-won means won on the first try</div>
                    <div>
                      Race: {oneAndWonsRace} {pluralize('time', oneAndWonsRace)}
                      <br />
                      Class: {oneAndWonsClass} {pluralize('time', oneAndWonsClass)}
                      <br />
                      Combo: {oneAndWons} {pluralize('time', oneAndWons)}
                    </div>
                  </div>
                }
              >
                <span>One-and-won</span>
              </Tooltip>,
              `${oneAndWons} ${pluralize('time', oneAndWons)}`,
            ],
          ]}
        />
        <List
          items={[
            ['Fastest win', stats.min.winTime ? formatDuration(stats.min.winTime) : 'n/a'],
            ['Slowest win', stats.max.winTime ? formatDuration(stats.max.winTime) : 'n/a'],
            [
              'Average win duration',
              stats.average.winTime ? formatDuration(stats.average.winTime) : 'n/a',
            ],
            [
              'Average game duration',
              stats.average.gameTime ? formatDuration(stats.average.gameTime) : 'n/a',
            ],
          ]}
        />
        <List
          items={[
            [
              'Fastest win, TC',
              stats.min.winTurnCount ? roundAndFormat(stats.min.winTurnCount) : 'n/a',
            ],
            [
              'Slowest win, TC',
              stats.max.winTurnCount ? roundAndFormat(stats.max.winTurnCount) : 'n/a',
            ],
            [
              'Average win turn count',
              stats.average.winTurnCount
                ? roundAndFormat(stats.average.winTurnCount, { maximumFractionDigits: 0 })
                : 'n/a',
            ],
          ]}
        />
        <div className="col-span-full">
          <List
            items={[
              [
                'Total time played',
                stats.total.timePlayed ? formatTimePlayed(stats.total.timePlayed) : 'n/a',
              ],
              [
                'First game',
                <GameTooltip key="" game={firstGame}>
                  {date(firstGame.endAt).format('DD MMM YYYY, HH:mm:ss')}
                </GameTooltip>,
              ],
              [
                'Most recent game',
                <GameTooltip key="" game={lastGame}>
                  {date(lastGame.endAt).format('DD MMM YYYY, HH:mm:ss')}
                </GameTooltip>,
              ],
              [
                'Lowest XL win',
                lowestXlWin ? (
                  <GameTooltip key="" game={lowestXlWin}>
                    {`${lowestXlWin.char} XL:${lowestXlWin.xl}, ${date(lowestXlWin.endAt).format(
                      'DD MMM YYYY, HH:mm:ss',
                    )}`}
                  </GameTooltip>
                ) : (
                  'n/a'
                ),
              ],
            ]}
          />
        </div>
      </div>
    </section>
  );
};

export const List = ({ items }: { items: [ReactNode, ReactNode][] }) => (
  <ul>
    {items.map(([title, text], index) => (
      <li key={index}>
        <span className="font-semibold">{title}:</span> {text}
      </li>
    ))}
  </ul>
);

const GameTooltip: FC<{ game: Game; children: ReactNode }> = ({ game, children }) => {
  return (
    <HeadlessTooltip
      interactive
      maxWidth="none"
      offset={[0, 0]}
      render={(attrs) => (
        <div className="max-w-[375px]" {...attrs}>
          <GameItem shadow game={game} />
        </div>
      )}
    >
      <span>{children}</span>
    </HeadlessTooltip>
  );
};

const formatTimePlayed = (seconds: number) => {
  const hours = seconds / 60 / 60;
  const days = Math.floor(hours / 24);
  const hoursRemainder = Math.round(hours - days * 24);

  return [
    days && `${days} ${pluralize('day', days)}`,
    `${roundAndFormat(hoursRemainder, {
      maximumFractionDigits: 0,
    })} ${pluralize('hour', hoursRemainder)}`,
  ]
    .filter(Boolean)
    .join(' and ');
};
