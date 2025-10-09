import { Footer } from '~/components/Footer'
import { Logo } from '~/components/Logo'
import { Matrix } from '~/components/Matrix'
import { ThemeSelector } from '~/components/ThemeSelector'
import { Badges } from './Badges'
import { Calendar } from './Calendar'
import { FavoriteButton } from './FavoriteButton'
import { Games } from './Games'
import { ProgressBadges } from './ProgressBadges'
import { Stats } from './Stats'
import { Streaks } from './Streaks'
import { Titles } from './Titles'
import { Winrates } from './Winrates'
import { usePlayerPageContext } from './context'

export const Player = () => {
  const { player, summary, isOptionEnabled, toggleOption } = usePlayerPageContext()
  const trunkDataKey = 'dcss-show-trunk-data'
  const showTrunkData = isOptionEnabled(trunkDataKey)

  return (
    <div className="container mx-auto grid gap-4 px-4 xl:grid-cols-3">
      <div className="min-w-0">
        <header className="flex items-center justify-between pt-4 pr-4 pb-2">
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
          <Calendar />
          <Titles />
          <Streaks />
          <Games />
        </div>
      </div>
      <div className="min-w-0 xl:col-span-2">
        <Matrix
          stats={summary.stats}
          allActualRaces={summary.allActualRaces}
          allActualClasses={summary.allActualClasses}
          greatRaces={summary.greatRaces}
          greatClasses={summary.greatClasses}
          showTrunkData={showTrunkData}
          toggleShowTrunkData={() => toggleOption(trunkDataKey)}
        />
      </div>
      <Footer className="col-span-full mt-0 border-t border-zinc-700 pt-4 pb-4" />
    </div>
  )
}
