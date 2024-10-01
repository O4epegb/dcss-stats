import { Footer } from '~/components/Footer'
import { Logo } from '~/components/Logo'
import { ThemeSelector } from '~/components/ThemeSelector'
import { Tooltip } from '~/components/ui/Tooltip'
import { formatNumber } from '~/utils'
import { Badges } from './Badges'
import { Calendar } from './Calendar'
import { FavoriteButton } from './FavoriteButton'
import { Games } from './Games'
import { Matrix } from './Matrix'
import { ProgressBadges } from './ProgressBadges'
import { Stats } from './Stats'
import { Streaks } from './Streaks'
import { Titles } from './Titles'
import { Winrates } from './Winrates'
import { usePlayerPageContext } from './context'

export const Player = () => {
  const { player, summary, gods, tiamat } = usePlayerPageContext()

  const { allActualClasses, allActualRaces } = summary

  const wonGodsStats = <TooltipTable data={gods} />
  const tiamatStats = <TooltipTable data={tiamat.detailed} />

  return (
    <div className="container mx-auto grid gap-4 px-4 xl:grid-cols-3">
      <div className="min-w-0">
        <header className="flex items-center justify-between pb-2 pr-4 pt-4">
          <Logo />
          <ThemeSelector />
        </header>
        <div className="space-y-2">
          <section className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <h2 className="text-3xl font-bold">{player.name}</h2>
            <FavoriteButton />
            <Badges wonGodsStats={wonGodsStats} tiamatStats={tiamatStats} />
          </section>
          <Winrates />
          <ProgressBadges wonGodsStats={wonGodsStats} tiamatStats={tiamatStats} />
          <Stats summary={summary} />
          <Calendar />
          <Titles />
          <Streaks />
          <Games allActualRaces={allActualRaces} allActualClasses={allActualClasses} />
        </div>
      </div>
      <div className="min-w-0 xl:col-span-2">
        <Matrix summary={summary} />
      </div>
      <Footer className="col-span-full mt-0 border-t border-zinc-700 pb-4 pt-4" />
    </div>
  )
}

const TooltipTable = ({
  data,
}: {
  data: Array<{
    name: string
    wins: number
    games: number
    gamesToFirstWin: number
  }>
}) => {
  return (
    <table>
      <thead>
        <tr>
          <th></th>
          <th className="px-1 py-0 text-right font-medium">W</th>
          <th className="px-1 py-0 text-right font-medium">G</th>
          <th className="px-1 py-0 text-right font-medium">
            <Tooltip content="First win after X games">
              <span>FW</span>
            </Tooltip>
          </th>
          <th className="px-1 py-0 text-right font-medium">WR</th>
        </tr>
      </thead>
      <tbody>
        {data
          .filter((item) => item.wins > 0)
          .map((item) => (
            <tr key={item.name}>
              <td className="py-0">{item.name}</td>
              <td className="px-1 py-0 text-right tabular-nums">{item.wins}</td>
              <td className="px-1 py-0 text-right tabular-nums">{item.games}</td>
              <td className="px-1 py-0 text-right tabular-nums">{item.gamesToFirstWin}</td>
              <td className="px-1 py-0 text-right tabular-nums">
                {formatNumber((item.wins / item.games || 0) * 100, {
                  maximumFractionDigits: 2,
                })}
                %
              </td>
            </tr>
          ))}
      </tbody>
    </table>
  )
}
