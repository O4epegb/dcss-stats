import dayjs from 'dayjs'
import localizedFormat from 'dayjs/plugin/localizedFormat'
import updateLocale from 'dayjs/plugin/updateLocale'
import weekOfYear from 'dayjs/plugin/weekOfYear'
import { groupBy, range } from 'lodash-es'
import { Fragment, useMemo } from 'react'
import useSWRImmutable from 'swr/immutable'
import { api } from '~/api'
import { Loader } from '~/components/ui/Loader'
import { Tooltip } from '~/components/ui/Tooltip'
import { useElementWidth } from '~/hooks/useElementWidth'
import { cn, formatNumber, pluralize } from '~/utils'
import { usePlayerPageContext } from './context'

dayjs.extend(updateLocale)
dayjs.extend(localizedFormat)
dayjs.extend(weekOfYear)

dayjs.updateLocale('en', {
  weekStart: 1,
})

export const CalendarHeatMap = () => {
  const { player } = usePlayerPageContext()
  const [ref, wrapperWidth] = useElementWidth<HTMLDivElement>()

  type DayData = {
    date: dayjs.Dayjs
    games: number
    wins: number
    winrate: number
  }

  const days = useMemo(() => {
    let widthLeft = wrapperWidth - 22
    const result: dayjs.Dayjs[] = []

    let current = dayjs().startOf('day')

    while (widthLeft > 0) {
      result.push(current)

      const next = current.subtract(1, 'day')

      if (next.month() !== current.month()) {
        widthLeft -= 30
      } else if (next.week() !== current.week()) {
        widthLeft -= 22
      }

      current = next
    }

    return result.reverse()
  }, [wrapperWidth])

  const fromDate = days[0]?.toISOString()
  const {
    data: calendarData,
    isLoading,
    error,
  } = useSWRImmutable(
    fromDate
      ? [
          `/players/${player.id}/calendar`,
          {
            from: fromDate,
          },
        ]
      : null,
    ([url, params]) =>
      api
        .get<{
          games: {
            endAt: string
            isWin: boolean
          }[]
        }>(url, { params })
        .then((res) => groupBy(res.data.games, (game) => dayjs(game.endAt).format('YYYY-MM-DD'))),
  )

  let data: DayData[] = days.map((day) => {
    const formattedDate = day.format('YYYY-MM-DD')
    const games = calendarData?.[formattedDate]?.length || 0
    const wins = calendarData?.[formattedDate]?.filter((game) => game.isWin).length || 0

    return {
      date: day,
      games,
      wins,
      winrate: games ? wins / games : 0,
    }
  })

  const showPlaceholder = wrapperWidth === 0
  if (showPlaceholder) {
    const now = dayjs()
    data = range(10).map((i) => ({
      date: now.subtract(i, 'day'),
      games: 0,
      wins: 0,
      winrate: 0,
    }))
  }

  let acc: DayData[] = []
  const monthesWithDays: DayData[][] = []
  let currentMonth = -1

  for (const day of data) {
    if (day.date.month() !== currentMonth) {
      currentMonth = day.date.month()
      acc = []
      monthesWithDays.push(acc)
    }

    acc.push(day)
  }

  const maxGames = Math.max(...data.map((day) => day.games)) || 1
  const totalGames = data.reduce((acc, day) => acc + day.games, 0)
  const totalWins = data.reduce((acc, day) => acc + day.wins, 0)

  return (
    <section ref={ref} className="space-y-1">
      <div className="flex items-center gap-2">
        <Tooltip
          content={
            <>
              {totalGames} {pluralize('game', totalGames)} games and {totalWins}{' '}
              {pluralize('win', totalWins)} (
              {formatNumber((totalWins / (totalGames || 1)) * 100, {
                maximumFractionDigits: 2,
              })}
              %) during shown period
            </>
          }
        >
          <h2 className="font-bold">Calendar</h2>
        </Tooltip>
        {isLoading && <Loader />}
        {error && <div className="text-sm text-red-600">Error fetching data</div>}
      </div>
      <div className={cn('flex gap-2', showPlaceholder && 'opacity-0')}>
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
                      {/* Amount of games since that month? */}
                    </>
                  }
                >
                  <span className="text-xs font-semibold">{firstDay.date.format('MMM')}</span>
                </Tooltip>
              </div>
              <div className="days grid grid-flow-col grid-rows-7 gap-0.5">
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
                          className={cn('day flex h-5 w-5 items-center justify-center rounded', {
                            'border border-zinc-300 dark:border-zinc-400':
                              day.games < maxGames * 0.9,
                          })}
                        >
                          <div
                            className={cn('rounded', {
                              'h-1 w-1': day.games > 0,
                              'h-2 w-2': day.games >= maxGames * 0.2,
                              'h-3 w-3': day.games >= maxGames * 0.55,
                              'h-full w-full': day.games >= maxGames * 0.9,
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
    </section>
  )
}
