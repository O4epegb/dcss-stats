import { Suspense } from 'react'
import { Footer } from '~/components/Footer'
import { HeaderWithMenu } from '~/components/HeaderWithMenu'
import { LiveGames, LiveGamesSkeleton } from './LiveGames'
import { Search } from './Search'
import { Stats } from './Stats'
import { Streams } from './Streams'
import { TournamentBanner } from './TournamentBanner'

export const MainPage = () => {
  return (
    <div className="container mx-auto flex min-h-dvh flex-col items-center px-4">
      <div className="w-full max-w-5xl space-y-4 py-4">
        <HeaderWithMenu showSupportGoal />

        <Search />

        <Suspense fallback={null}>
          <TournamentBanner />
        </Suspense>

        <Streams />

        <Suspense fallback={<LiveGamesSkeleton />}>
          <LiveGames />
        </Suspense>

        <Stats />

        <Footer />
      </div>
    </div>
  )
}
