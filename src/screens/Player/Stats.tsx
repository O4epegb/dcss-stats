import { ReactNode, FC } from 'react';
import { filter } from 'lodash-es';
import { Game } from '@types';
import { pluralize, date, formatDuration, roundAndFormat, formatNumber } from '@utils';
import { Tooltip } from '@components/Tooltip';
import { GameItem } from '@components/GameItem';
import { GameTooltip } from '@components/GameTooltip';
import { usePlayerPageContext } from './context';
import { Summary } from './utils';

export const Stats = ({ summary }: { summary: Summary }) => {
  const { firstGame, firstWin, gamesBeforeFirstWin, lowestXlWin, stats, player } =
    usePlayerPageContext();
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
              <span key="">One-and-won</span>,
              `${oneAndWons} ${pluralize('time', oneAndWons)}`,
              <div key="" className="space-y-2">
                <div>One-and-won means won on the first try</div>
                <div>
                  Race: {oneAndWonsRace} {pluralize('time', oneAndWonsRace)}
                  <br />
                  Class: {oneAndWonsClass} {pluralize('time', oneAndWonsClass)}
                  <br />
                  Combo: {oneAndWons} {pluralize('time', oneAndWons)}
                </div>
              </div>,
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

                <span key="">
                  {stats.total.timePlayed ? formatTimePlayed(stats.total.timePlayed) : 'n/a'}
                </span>,
                stats.total.timePlayed && (
                  <span key="">
                    {stats.total.timePlayed
                      ? `${formatNumber(stats.total.timePlayed / 60 / 60, {
                          maximumFractionDigits: 1,
                        })} ${pluralize('hour', stats.total.timePlayed / 60 / 60)}`
                      : ''}
                  </span>
                ),
              ],
              [
                'First game',
                <StatsGameTooltip key="" game={firstGame}>
                  {firstGame.char}
                  {firstGame.god ? ` of ${firstGame.god}` : ''},{' '}
                  {date(firstGame.endAt).format('DD MMM YYYY')}
                </StatsGameTooltip>,
              ],
              [
                'First win',
                firstWin ? (
                  <GameTooltip key="" id={firstWin.id} player={player.name}>
                    <span>
                      {firstWin.char}
                      {firstWin.god ? ` of ${firstWin.god}` : ''}, won after {gamesBeforeFirstWin}{' '}
                      {pluralize('game', gamesBeforeFirstWin)},{' '}
                      {date(firstWin.endAt).format('DD MMM YYYY')}
                    </span>
                  </GameTooltip>
                ) : (
                  'n/a'
                ),
              ],
              [
                'Lowest XL win',
                lowestXlWin ? (
                  <StatsGameTooltip key="" game={lowestXlWin}>
                    {`${lowestXlWin.char}${lowestXlWin.god ? ` of ${lowestXlWin.god}` : ''}, XL:${
                      lowestXlWin.xl
                    }, ${date(lowestXlWin.endAt).format('DD MMM YYYY')}`}
                  </StatsGameTooltip>
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

export const List = ({ items }: { items: [ReactNode, ReactNode, ReactNode?][] }) => (
  <ul className="flex flex-col items-start">
    {items.map(([title, text, tooltip], index) => {
      const content = (
        <li key={index}>
          <span className="font-semibold">{title}:</span> {text}
        </li>
      );

      return tooltip ? (
        <Tooltip key={index} content={tooltip}>
          {content}
        </Tooltip>
      ) : (
        content
      );
    })}
  </ul>
);

const StatsGameTooltip: FC<{ game: Game; children: ReactNode }> = ({ game, children }) => {
  return (
    <Tooltip interactive content={<GameItem shadow game={game} />}>
      <span>{children}</span>
    </Tooltip>
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
