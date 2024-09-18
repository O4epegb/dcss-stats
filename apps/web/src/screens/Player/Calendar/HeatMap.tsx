import dayjs from 'dayjs'
import { range } from 'lodash-es'
import { Fragment, useState } from 'react'
import { Tooltip } from '~/components/ui/Tooltip'
import { cn, pluralize, formatNumber } from '~/utils'

export type DayData = {
  date: dayjs.Dayjs
  games: number
  wins: number
  winrate: number
}

const cellSize = 20
const cellSizeCss = 'size-[20px]'
const cellGap = 2
export const monthGap = 8
export const cellAndGap = cellSize + cellGap

export const HeatMap = ({
  monthesWithDays,
  maxGames,
  invisible,
}: {
  monthesWithDays: DayData[][]
  maxGames: number
  invisible?: boolean
}) => {
  return (
    <div
      style={{
        gap: `${monthGap}px`,
      }}
      className={cn('flex', invisible && 'opacity-0')}
    >
      {monthesWithDays.map((month, monthIndex) => {
        const firstDay = month[0]

        const games = month.reduce((acc, day) => acc + day.games, 0)
        const wins = month.reduce((acc, day) => acc + day.wins, 0)

        return (
          <div key={monthIndex} className="month space-y-1">
            <div className="flex">
              <Tooltip
                content={
                  <>
                    <span className="font-medium">{firstDay.date.format('MMMM YYYY')}</span>
                    <br />
                    <StatsTooltipBlock games={games} wins={wins} />
                  </>
                }
              >
                <span className="text-xs font-semibold">{firstDay.date.format('MMM')}</span>
              </Tooltip>
            </div>
            <div
              style={{
                gap: `${cellGap}px`,
              }}
              className="grid grid-flow-col grid-rows-7"
            >
              {month.map((day, dayIndex) => {
                let daysToPad = 0

                if (dayIndex === 0) {
                  const startOfWeek = day.date.startOf('week')
                  daysToPad = day.date.diff(startOfWeek, 'days')
                }

                return (
                  <Fragment key={dayIndex}>
                    {daysToPad > 0 &&
                      range(daysToPad).map((i) => (
                        <div key={i} className="day text-center text-transparent" />
                      ))}

                    <Tooltip
                      key={dayIndex}
                      content={
                        <>
                          <span className="font-medium">
                            {day.date.format('LL')}, {day.date.format('dddd')}
                          </span>
                          <br />
                          <StatsTooltipBlock games={day.games} wins={day.wins} />
                        </>
                      }
                    >
                      <div
                        className={cn('flex items-center justify-center rounded', cellSizeCss, {
                          'border border-zinc-300 dark:border-zinc-400': day.games < maxGames * 0.9,
                        })}
                      >
                        <div
                          className={cn('rounded', {
                            'size-1': day.games > 0,
                            'size-2': day.games >= maxGames * 0.2,
                            'size-3': day.games >= maxGames * 0.55,
                            'size-full': day.games >= maxGames * 0.9,
                            'bg-amber-300': day.winrate === 0,
                            'bg-emerald-300': day.winrate > 0,
                            'bg-emerald-400': day.winrate >= 0.1,
                            'bg-emerald-500': day.winrate >= 0.25,
                            'bg-emerald-600': day.winrate >= 0.5,
                          })}
                        />
                      </div>
                    </Tooltip>
                  </Fragment>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export const HeatMapFlat = ({
  monthesWithDays,
  maxGamesPerDay,
  invisible,
}: {
  monthesWithDays: DayData[][]
  maxGamesPerDay: number
  invisible?: boolean
}) => {
  const [tooltipData, setTooltipData] = useState<{
    ref: HTMLElement
    day: DayData
  } | null>(null)

  return (
    <div
      className={cn(
        'relative grid auto-cols-[16px] grid-flow-col grid-rows-[repeat(7,16px)] items-start justify-start gap-0.5 pt-5',
        invisible && 'opacity-0',
      )}
    >
      {tooltipData && (
        <Tooltip
          restMs={0}
          delay={0}
          triggerElement={tooltipData.ref}
          content={
            <>
              <span className="font-medium">
                {tooltipData.day.date.format('LL')}, {tooltipData.day.date.format('dddd')}
              </span>
              <br />
              <StatsTooltipBlock games={tooltipData.day.games} wins={tooltipData.day.wins} />
            </>
          }
        />
      )}

      {monthesWithDays.flatMap((month, monthIndex) => {
        const firstDay = month[0]
        const games = month.reduce((acc, day) => acc + day.games, 0)
        const wins = month.reduce((acc, day) => acc + day.wins, 0)

        return month.map((day, dayIndex) => {
          let daysToPad = 0

          if (monthIndex === 0 && dayIndex === 0) {
            const startOfWeek = day.date.startOf('week')
            daysToPad = day.date.diff(startOfWeek, 'days')
          }

          return (
            <Fragment key={`${dayIndex}-${monthIndex}`}>
              {daysToPad > 0 &&
                range(daysToPad).map((i) => (
                  <div key={i} className="text-center text-transparent" />
                ))}

              <div className="size-full">
                {dayIndex === 0 && (
                  <Tooltip
                    content={
                      <>
                        <span className="font-medium">{firstDay.date.format('MMMM YYYY')}</span>
                        <br />
                        <StatsTooltipBlock games={games} wins={wins} />
                      </>
                    }
                  >
                    <div className="absolute top-0 text-xs font-semibold">
                      {day.date.format('MMM')}
                    </div>
                  </Tooltip>
                )}
                <div
                  className={cn('flex size-full items-center justify-center rounded', {
                    'border border-zinc-300 dark:border-zinc-400':
                      day.games < maxGamesPerDay * 0.75,
                  })}
                  onMouseEnter={(e) => {
                    setTooltipData({
                      ref: e.currentTarget,
                      day,
                    })
                  }}
                  onMouseLeave={() => setTooltipData(null)}
                >
                  <div
                    className={cn('rounded', {
                      'size-[30%]': day.games > 0,
                      'size-[50%]': day.games >= maxGamesPerDay * 0.25,
                      'size-[75%]': day.games >= maxGamesPerDay * 0.5,
                      'size-full': day.games >= maxGamesPerDay * 0.75,
                      'bg-amber-300': day.winrate === 0,
                      'bg-emerald-300': day.winrate > 0,
                      'bg-emerald-400': day.winrate >= 0.1,
                      'bg-emerald-500': day.winrate >= 0.25,
                      'bg-emerald-600': day.winrate >= 0.5,
                    })}
                  />
                </div>
              </div>
            </Fragment>
          )
        })
      })}
    </div>
  )
}

const StatsTooltipBlock = ({ games, wins }: { games: number; wins: number }) => {
  return (
    <>
      <span className="font-medium">{formatNumber(games)}</span> {pluralize('game', games)}
      <br />
      <span className="font-medium">{wins}</span> {pluralize('win', wins)}
      <br />
      <span className="font-medium">
        {formatNumber((wins / (games || 1)) * 100, {
          maximumFractionDigits: 2,
        })}
        %
      </span>{' '}
      WR
    </>
  )
}
