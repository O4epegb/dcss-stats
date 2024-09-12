import { Logo } from '~/components/Logo'
import { ThemeSelector } from '~/components/ThemeSelector'
import { Badges } from './Badges'
import { CalendarHeatMap } from './CalendarHeatMap'
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
  const { player, summary } = usePlayerPageContext()

  const { allActualClasses, allActualRaces } = summary

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
            <Badges />
          </section>
          <Winrates />
          <ProgressBadges />
          <Stats summary={summary} />
          <CalendarHeatMap />
          <Titles />
          <Streaks />
          <Games allActualRaces={allActualRaces} allActualClasses={allActualClasses} />
        </div>
      </div>
      <div className="min-w-0 xl:col-span-2">
        <Matrix summary={summary} />
      </div>
    </div>
  )
}
