import { filter } from 'lodash-es'
import { ReactNode, FC } from 'react'
import { GameCard } from '~/components/GameCard'
import { GameTooltip } from '~/components/GameTooltip'
import { Date } from '~/components/ui/Date'
import { Tooltip } from '~/components/ui/Tooltip'
import { Game } from '~/types'
import { pluralize, formatDuration, roundAndFormat, formatNumber } from '~/utils'
import { usePlayerPageContext } from './context'
import { Summary } from './utils'

export const Stats = ({ summary }: { summary: Summary }) => {
  const { firstGame, firstWin, gamesBeforeFirstWin, lowestXlWin, stats, player } =
    usePlayerPageContext()
  const {
    combosCompleted,
    totalCombos,
    stats: { combos, races, classes },
  } = summary

  const oneAndWons = filter(combos, (value) => value.gamesToFirstWin === 1).length
  const oneAndWonsRace = filter(races, (value) => value.gamesToFirstWin === 1).length
  const oneAndWonsClass = filter(classes, (value) => value.gamesToFirstWin === 1).length

  return (
    <section className="space-y-2 text-xs">
      <div className="grid grid-cols-2 gap-x-1 gap-y-2">
        <List
          items={[
            ['Total score', roundAndFormat(stats.total.score)],
            ['Best score', roundAndFormat(stats.max.score)],
            ['Average score', roundAndFormat(stats.average.score, { maximumFractionDigits: 0 })],
            ['Combos completed', `${combosCompleted} of ${totalCombos}`],
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
            ['Total runes extracted', roundAndFormat(stats.total.runesWon)],
            ['Total runes lost', roundAndFormat(stats.total.runesLost)],
            [
              'Average runes extracted',
              roundAndFormat(stats.average.runesWon, { maximumFractionDigits: 1 }),
            ],
            ['Total gems extracted', roundAndFormat(stats.total.gemsWon)],
            ['Total gems lost', roundAndFormat(stats.total.gemsLost)],
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
            [
              'Average game turn count',
              stats.average.gameTurnCount
                ? roundAndFormat(stats.average.gameTurnCount, { maximumFractionDigits: 0 })
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
                  {stats.total.timePlayed
                    ? `${formatNumber(stats.total.timePlayed / 60 / 60, {
                        maximumFractionDigits: 0,
                      })} ${pluralize('hour', stats.total.timePlayed / 60 / 60)}`
                    : 'n/a'}
                </span>,
              ],
              [
                'First game',
                <StatsGameTooltip key="" game={firstGame}>
                  {firstGame.char}
                  {firstGame.god ? ` of ${firstGame.god}` : ''},{' '}
                  <Date value={firstGame.endAt} format="DD MMM YYYY" />
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
                      <Date value={firstWin.endAt} format="DD MMM YYYY" />
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
                    },`}{' '}
                    <Date value={lowestXlWin.endAt} format="DD MMM YYYY" />
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
  )
}

export const List = ({ items }: { items: [ReactNode, ReactNode, ReactNode?][] }) => (
  <ul className="flex flex-col items-start">
    {items.map(([title, text, tooltip], index) => {
      const content = (
        <li key={index}>
          <span className="font-semibold">{title}:</span> {text}
        </li>
      )

      return tooltip ? (
        <Tooltip key={index} content={tooltip}>
          {content}
        </Tooltip>
      ) : (
        content
      )
    })}
  </ul>
)

const StatsGameTooltip: FC<{ game: Game; children: ReactNode }> = ({ game, children }) => {
  return (
    <Tooltip interactive content={<GameCard shadow game={game} />}>
      <span>{children}</span>
    </Tooltip>
  )
}
