import dayjs from 'dayjs'
import { groupBy, range } from 'lodash-es'
import { useMemo } from 'react'
import useSWRImmutable from 'swr/immutable'
import { api } from '~/api'
import { Loader } from '~/components/ui/Loader'
import { Tooltip } from '~/components/ui/Tooltip'
import { useElementWidth } from '~/hooks/useElementWidth'
import { usePlayerPageContext } from '~/screens/Player/context'
import { date, formatNumber, pluralize } from '~/utils'
import { cellPlusGap, DayData, HeatMap, monthGap } from './HeatMap'
import { HistoryDialog } from './HistoryDialog'

export const Calendar = () => {
  const { player } = usePlayerPageContext()
  const [ref, wrapperWidth] = useElementWidth<HTMLDivElement>()

  const days = useMemo(() => {
    let widthLeft = wrapperWidth - cellPlusGap
    const result: dayjs.Dayjs[] = []

    let current = date().startOf('day')

    while (widthLeft > 0) {
      result.push(current)

      const next = current.subtract(1, 'day')

      if (next.month() !== current.month()) {
        widthLeft -= cellPlusGap + monthGap
      } else if (next.week() !== current.week()) {
        widthLeft -= cellPlusGap
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
        .then((res) => groupBy(res.data.games, (game) => date(game.endAt).format('YYYY-MM-DD'))),
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
    const now = date()
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
              <div className="pt-2 text-xs text-gray-300 dark:text-gray-700">
                Calendar shows completion based on{' '}
                <code className="rounded bg-slate-600 px-1 dark:bg-slate-300">endAt</code> field,
                <br /> so it may differ from the game list, which uses{' '}
                <code className="rounded bg-slate-600 px-1 dark:bg-slate-300">startAt</code> as the
                ordering field.
              </div>
            </>
          }
        >
          <h2 className="font-bold">Calendar</h2>
        </Tooltip>
        <HistoryDialog />
        {isLoading && <Loader />}
        {error && <div className="text-sm text-red-600">Error fetching data</div>}
      </div>
      <HeatMap maxGames={maxGames} invisible={showPlaceholder} monthesWithDays={monthesWithDays} />
    </section>
  )
}
