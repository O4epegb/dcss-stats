import { groupBy, range } from 'lodash-es'
import { useMemo } from 'react'
import useSWRImmutable from 'swr/immutable'
import { api } from '~/api'
import { WinrateStats } from '~/components/WinrateStats'
import { Dialog, DialogContent, DialogTrigger } from '~/components/ui/Dialog'
import { Loader } from '~/components/ui/Loader'
import { usePlayerPageContext } from '~/screens/Player/context'
import { date } from '~/utils'
import { DayData, HeatMapFlat } from './HeatMap'

export const HistoryDialog = () => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="py-0.5 text-sm text-blue-400 hover:underline">Show full</button>
      </DialogTrigger>
      <DialogContent title="All time game history">
        <Content />
      </DialogContent>
    </Dialog>
  )
}

const Content = () => {
  const { player, firstGame } = usePlayerPageContext()

  const {
    data: calendarData,
    isLoading,
    error,
  } = useSWRImmutable([`/players/${player.id}/calendar`], ([url]) =>
    api
      .get<{
        games: {
          endAt: string
          isWin: boolean
        }[]
      }>(url)
      .then((res) => groupBy(res.data.games, (game) => date(game.endAt).format('YYYY-MM-DD'))),
  )

  const yearlyData = useMemo(() => {
    const year = date().year()
    const startYear = firstGame ? date(firstGame.endAt).year() : year

    return range(startYear, year + 1)
      .map((year) => {
        const start = date().year(year).startOf('year')
        const end = date().year(year).endOf('year')

        let current = start
        const data: DayData[] = []

        while (current.isBefore(end)) {
          const formattedDate = current.format('YYYY-MM-DD')
          const games = calendarData?.[formattedDate]?.length || 0
          const wins = calendarData?.[formattedDate]?.filter((game) => game.isWin).length || 0

          data.push({
            date: current,
            games,
            wins,
            winrate: games ? wins / games : 0,
          })

          current = current.add(1, 'day')
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

        return {
          year,
          monthesWithDays,
        }
      })
      .reverse()
  }, [calendarData])

  const maxGamesPerDay =
    Math.max(
      ...yearlyData.flatMap((yearData) => yearData.monthesWithDays.flat().map((day) => day.games)),
    ) || 1

  return (
    <>
      <div className="flex items-center gap-2">
        {isLoading && <Loader />}
        {error && <div className="text-sm text-red-600">Error fetching data</div>}
      </div>

      <div className="space-y-4">
        {yearlyData.map((yearData, yearIndex) => {
          const games = yearData.monthesWithDays.flat().reduce((acc, day) => acc + day.games, 0)
          const wins = yearData.monthesWithDays.flat().reduce((acc, day) => acc + day.wins, 0)

          return (
            <div key={yearIndex} className="space-y-0.5">
              <div className="flex items-center gap-2 leading-none">
                <h3 className="text-sm font-bold">{yearData.year}</h3>
                <WinrateStats small className="text-sm" games={games} wins={wins} />
              </div>
              <HeatMapFlat
                maxGamesPerDay={maxGamesPerDay}
                monthesWithDays={yearData.monthesWithDays}
              />
            </div>
          )
        })}
      </div>
    </>
  )
}
