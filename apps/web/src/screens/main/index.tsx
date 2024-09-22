'use client'

import Link from 'next/link'
import { useState, useCallback } from 'react'
import { Footer } from '~/components/Footer'
import { Logo } from '~/components/Logo'
import { ThemeSelector } from '~/components/ThemeSelector'
import { Class, Game, God, Player, Race } from '~/types'
import { Search } from './Search'
import { Stats } from './Stats'
import { TournamentBanner } from './TournamentBanner'

export const MainPage = (props: Props) => {
  const [isNavigating, setIsNavigating] = useState(false)
  const [query, setQuery] = useState('')

  const onLinkClick = useCallback((name: string) => {
    setIsNavigating(true)
    setQuery(name)
  }, [])

  return (
    <div className="container mx-auto flex min-h-screen flex-col items-center px-4 pt-8 md:justify-center md:pt-0">
      <div className="w-full max-w-5xl space-y-4 py-4">
        <header className="flex w-full items-center justify-between">
          <Logo />
          <div className="flex gap-5">
            <ThemeSelector />
            <Link className="group" href="/suggest">
              <span className="text-xs group-hover:underline sm:text-base">Combos</span>
            </Link>
            <Link className="group" href="/search">
              <span className="text-xs group-hover:underline sm:text-base">Search</span>{' '}
            </Link>
          </div>
        </header>
        <Search
          nickname={props.nickname}
          isNavigating={isNavigating}
          setIsNavigating={setIsNavigating}
          query={query}
          setQuery={setQuery}
        />

        <TournamentBanner />

        <Stats {...props} onLinkClick={onLinkClick} />

        <Footer />
      </div>
    </div>
  )
}

type Stats = { wins: number; total: number }
type Combos = Record<string, Stats>
type CombosData = Stats & { combos: Combos }

export type Response = {
  games: number
  wins: number
  races: Race[]
  classes: Class[]
  gods: God[]
  combosData: CombosData
  top: {
    byWins: Array<Pick<Player, 'name'> & { wins: number }>
    byWinrate: Array<Pick<Player, 'name'> & { winrate: number }>
    byTitles: Array<Pick<Player, 'name'> & { titles: number }>
    gamesByTC: Array<Game>
    gamesByDuration: Array<Game>
    gamesByScore: Array<Game>
  }
}

export type Props = Response & {
  nickname: string
}
