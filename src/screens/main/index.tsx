'use client'

import Link from 'next/link'
import { useState, useCallback } from 'react'
import { Class, Game, God, Player, Race } from '@types'
import { Logo } from '@components/Logo'
import { ThemeSelector } from '@components/ThemeSelector'
import { Search } from './Search'
import { Stats } from './Stats'

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
        <Stats {...props} onLinkClick={onLinkClick} />

        <footer className="grid justify-between gap-1 text-xs text-gray-400 md:grid-cols-2">
          <div>
            Player and game statistics for{' '}
            <a
              href="https://crawl.develz.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline"
            >
              Dungeon Crawl Stone Soup
            </a>
          </div>

          <div className="flex gap-4 md:justify-end">
            <Link className="hover:underline" prefetch={false} href="/servers">
              Tracked servers
            </Link>

            <a
              href="https://github.com/O4epegb/dcss-stats"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline"
            >
              Github
            </a>

            <a
              href="https://www.buymeacoffee.com/totalnoob"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline"
            >
              Donate to support this site
            </a>
          </div>

          <div>
            Made by <span className="font-semibold text-gray-500">totalnoob</span>, DM on{' '}
            <a
              href="https://discord.gg/pKCNTunFeW"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline"
            >
              RL Discord
            </a>{' '}
            with bugs and suggestions
          </div>
        </footer>
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
