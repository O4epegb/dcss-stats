import Link from 'next/link'
import { Suspense } from 'react'
import { Footer } from '~/components/Footer'
import { Logo } from '~/components/Logo'
import { ThemeSelector } from '~/components/ThemeSelector'
import { Search } from './Search'
import { Stats } from './Stats'
import { Streams } from './Streams'
import { SupportGoalText } from './SupportGoalText'
import { TournamentBanner } from './TournamentBanner'

export const MainPage = () => {
  return (
    <div className="container mx-auto flex min-h-screen flex-col items-center px-4 md:justify-center">
      <div className="w-full max-w-5xl space-y-4 py-4">
        <header className="flex w-full flex-wrap items-center justify-between gap-1 gap-y-2 sm:flex-nowrap">
          <Logo />

          <div className="ml-auto flex flex-1 justify-end gap-2 text-xs sm:w-auto sm:gap-3 sm:text-sm md:gap-5 md:text-base">
            <Link
              className="group relative flex flex-col items-center justify-center"
              href="/support"
            >
              <span className="flex items-center justify-center gap-1 group-hover:underline">
                Support
              </span>
              <Suspense fallback={null}>
                <SupportGoalText />
              </Suspense>
            </Link>
            <Link className="group relative flex items-center justify-center" href="/charts">
              <span className="group-hover:underline">Charts</span>
            </Link>
            <Link className="group relative flex items-center justify-center" href="/streaks">
              <span className="group-hover:underline">Streaks</span>
              <span className="absolute top-full rounded bg-amber-400 px-1 text-xs text-nowrap text-black">
                new
              </span>
            </Link>
            <Link className="group flex items-center justify-center" href="/suggest">
              <span className="group-hover:underline">Combos</span>
            </Link>
            <Link className="group flex items-center justify-center" href="/search">
              <span className="group-hover:underline">Search</span>{' '}
            </Link>
            <ThemeSelector />
          </div>
        </header>

        <Search />

        <Suspense fallback={null}>
          <TournamentBanner />
        </Suspense>

        <Suspense fallback={null}>
          <Streams />
        </Suspense>

        <Suspense fallback={null}>
          <Stats />
        </Suspense>

        <Footer />
      </div>
    </div>
  )
}
