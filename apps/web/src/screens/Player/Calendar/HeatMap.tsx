import dayjs from 'dayjs'
import { range } from 'lodash-es'
import { Fragment } from 'react'
import { Tooltip } from '~/components/ui/Tooltip'
import { cn, pluralize, formatNumber } from '~/utils'

export type DayData = {
  date: dayjs.Dayjs
  games: number
  wins: number
  winrate: number
}

export const cellSize = 20
export const cellGap = 2
export const monthGap = 8
export const cellPlusGap = cellSize + cellGap

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
    <div className={cn('flex gap-2', invisible && 'opacity-0')}>
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
                    {games} {pluralize('game', games)}
                    <br />
                    {wins} {pluralize('win', wins)}
                    <br />
                    {formatNumber((wins / (games || 1)) * 100, {
                      maximumFractionDigits: 2,
                    })}
                    % WR
                  </>
                }
              >
                <span className="text-xs font-semibold">{firstDay.date.format('MMM')}</span>
              </Tooltip>
            </div>
            <div className="grid grid-flow-col grid-rows-7 gap-0.5">
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
                          {day.games} {pluralize('game', day.games)}
                          <br />
                          {day.wins} wins
                          <br />
                          {formatNumber((day.wins / (day.games || 1)) * 100, {
                            maximumFractionDigits: 2,
                          })}
                          % WR
                        </>
                      }
                    >
                      <div
                        className={cn('flex h-5 w-5 items-center justify-center rounded', {
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
  maxGames,
  invisible,
}: {
  monthesWithDays: DayData[][]
  maxGames: number
  invisible?: boolean
}) => {
  return (
    <div
      className={cn(
        'relative grid auto-cols-[16px] grid-flow-col grid-rows-[repeat(7,16px)] items-start justify-start gap-0.5 pt-5',
        invisible && 'opacity-0',
      )}
    >
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

              <div
                className={cn('flex size-full items-center justify-center rounded', {
                  'border border-zinc-300 dark:border-zinc-400': day.games < maxGames * 0.75,
                })}
              >
                {dayIndex === 0 && (
                  <Tooltip
                    content={
                      <>
                        <span className="font-medium">{firstDay.date.format('MMMM YYYY')}</span>
                        <br />
                        {games} {pluralize('game', games)}
                        <br />
                        {wins} {pluralize('win', wins)}
                        <br />
                        {formatNumber((wins / (games || 1)) * 100, {
                          maximumFractionDigits: 2,
                        })}
                        % WR
                      </>
                    }
                  >
                    <div className="absolute top-0 text-xs font-semibold">
                      {day.date.format('MMM')}
                    </div>
                  </Tooltip>
                )}
                <div
                  className={cn('rounded', {
                    'size-[30%]': day.games > 0,
                    'size-[50%]': day.games >= maxGames * 0.25,
                    'size-[75%]': day.games >= maxGames * 0.5,
                    'size-full': day.games >= maxGames * 0.75,
                    'bg-amber-300': day.winrate === 0,
                    'bg-emerald-300': day.winrate > 0,
                    'bg-emerald-400': day.winrate >= 0.1,
                    'bg-emerald-500': day.winrate >= 0.25,
                    'bg-emerald-600': day.winrate >= 0.5,
                  })}
                />
              </div>
            </Fragment>
          )
        })
      })}
    </div>
  )
}
