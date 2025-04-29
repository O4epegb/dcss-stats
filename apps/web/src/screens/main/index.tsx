'use client'

import Link from 'next/link'
import { useState, useCallback } from 'react'
import useSWRImmutable from 'swr/immutable'
import { api } from '~/api'
import { Footer } from '~/components/Footer'
import { Logo } from '~/components/Logo'
import { ThemeSelector } from '~/components/ThemeSelector'
import { Class, Game, God, Player, Race, SupportersCurrentResponse } from '~/types'
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

  const { data } = useSWRImmutable('/supporters/current', (url) =>
    api.get<SupportersCurrentResponse>(url).then((res) => res.data),
  )

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
              {data && (
                <span className="absolute top-full text-nowrap text-2xs text-gray-400 sm:text-xs">
                  {data.total >= data.goal ? (
                    <>Goal: done! (${data.total})</>
                  ) : (
                    <>
                      Goal: ${data.total} of ${data.goal}
                    </>
                  )}
                </span>
              )}
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
    gamesByEndAt: Array<Game>
    gamesByTC: Array<Game>
    gamesByDuration: Array<Game>
    gamesByScore: Array<Game>
    gamesByTC15Runes: Array<Game>
    gamesByDuration15Runes: Array<Game>
    gamesByScore3Runes: Array<Game>
  }
}

export type Props = Response & {
  nickname: string
}
