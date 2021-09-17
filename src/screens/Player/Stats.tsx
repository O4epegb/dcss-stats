import { ReactNode, FC } from 'react';
import { Game } from '@types';
import { addS, date, formatDuration, roundAndFormat } from '@utils';
import { GameItem } from '@components/GamesList';
import { HeadlessTooltip } from '@components/Tooltip';
import { usePlayerPageContext } from './context';

export const Stats = () => {
  const { firstGame, lastGame, lowestXlWin, stats } = usePlayerPageContext();

  return (
    <section className="text-xs space-y-2">
      <div className="grid grid-cols-2 gap-x-1 gap-y-2">
        <List
          items={[
            ['Total score', roundAndFormat(stats.total.score)],
            ['Best score', roundAndFormat(stats.max.score)],
            ['Average score', roundAndFormat(stats.average.score, { maximumFractionDigits: 0 })],
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
          ]}
        />
        <List
          items={[
            [
              'Average win duration',
              stats.average.winTime ? formatDuration(stats.average.winTime) : 'n/a',
            ],
            ['Fastest win', stats.min.winTime ? formatDuration(stats.min.winTime) : 'n/a'],
            ['Slowest win', stats.max.winTime ? formatDuration(stats.max.winTime) : 'n/a'],
            [
              'Average game duration',
              stats.average.gameTime ? formatDuration(stats.average.gameTime) : 'n/a',
            ],
          ]}
        />
        <List
          items={[
            [
              'Average win turn count',
              stats.average.winTurnCount
                ? roundAndFormat(stats.average.winTurnCount, { maximumFractionDigits: 0 })
                : 'n/a',
            ],
            [
              'Fastest win, TC',
              stats.min.winTurnCount ? roundAndFormat(stats.min.winTurnCount) : 'n/a',
            ],
            [
              'Slowest win, TC',
              stats.max.winTurnCount ? roundAndFormat(stats.max.winTurnCount) : 'n/a',
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
                    {`${lowestXlWin.char} XL ${lowestXlWin.xl}, ${date(lowestXlWin.endAt).format(
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

export const List = ({ items }: { items: [string, ReactNode][] }) => (
  <ul>
    {items.map(([title, text]) => (
      <li key={title}>
        <span className="font-semibold">{title}:</span> {text}
      </li>
    ))}
  </ul>
);

const GameTooltip: FC<{ game: Game }> = ({ game, children }) => {
  return (
    <HeadlessTooltip
      interactive
      maxWidth="none"
      offset={[0, 0]}
      render={(attrs) => (
        <ul tabIndex={-1} className="max-w-[375px]" {...attrs}>
          <GameItem shadow game={game} playerName={game.player?.name} />
        </ul>
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
    days && `${days} ${addS('day', days)}`,
    `${roundAndFormat(hoursRemainder, {
      maximumFractionDigits: 0,
    })} ${addS('hour', hoursRemainder)}`,
  ]
    .filter(Boolean)
    .join(' and ');
};
