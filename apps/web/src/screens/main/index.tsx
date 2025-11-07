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

export const MainPage = async () => {
  'use cache'

  return (
    <div className="container mx-auto flex min-h-screen flex-col items-center px-4 md:justify-center">
      <div className="w-full max-w-5xl space-y-4 py-4">
        <header className="flex w-full flex-wrap items-center justify-between gap-1 gap-y-2 sm:flex-nowrap">
          <Logo />

          <div className="ml-auto flex flex-1 justify-end gap-3 sm:w-auto sm:gap-5">
            <Link
              className="group relative flex flex-col items-center justify-center"
              href="/support"
            >
              <span className="flex items-center justify-center gap-1 text-xs group-hover:underline sm:text-base">
                Support
              </span>
              <Suspense>
                <SupportGoalText />
              </Suspense>
            </Link>
            <Link className="group relative flex items-center justify-center" href="/charts">
              <span className="text-xs group-hover:underline sm:text-base">Charts</span>
            </Link>
            <Link className="group flex items-center justify-center" href="/suggest">
              <span className="text-xs group-hover:underline sm:text-base">Combos</span>
            </Link>
            <Link className="group flex items-center justify-center" href="/search">
              <span className="text-xs group-hover:underline sm:text-base">Search</span>{' '}
            </Link>
            <ThemeSelector />
          </div>
        </header>

        <Search />

        <TournamentBanner />

        <Suspense>
          <Streams />
        </Suspense>

        <Stats />

        <Footer />
      </div>
    </div>
  )
}
