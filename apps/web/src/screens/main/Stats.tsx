import { map, pickBy } from 'lodash-es'
import Link from 'next/link'
import { useState, memo, useEffect, PropsWithChildren } from 'react'
import { WinrateStats } from '~/components/WinrateStats'
import { HelpBubble } from '~/components/ui/Tooltip'
import { getFavorites } from '~/screens/Player/utils'
import { Class, God, Race } from '~/types'
import { formatNumber } from '~/utils'
import { List } from './List'
import { Streams } from './Streams'
import { Table } from './Table'
import type { Props } from '.'

type NormalizedData = {
  race: Race | undefined
  class: Class | undefined
  god: God | undefined
  winrate: number
  wins: number
  total: number
}[]

export const Stats = memo(
  ({
    gamesByEndAt,
    gamesByDuration,
    gamesByScore,
    gamesByTC,
    gamesByTC15Runes,
    gamesByDuration15Runes,
    gamesByScore3Runes,
    races,
    classes,
    gods,
    combosData,
    topPlayers,
    topPlayersRecent,
    topPlayersWithManyGames,
    onLinkClick,
  }: Props & { onLinkClick: (name: string) => void }) => {
    const [favorites, setFavorites] = useState<null | string[]>(null)

    useEffect(() => {
      setFavorites(getFavorites().split(',').filter(Boolean))
    }, [])

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const popularPicksData: NormalizedData = map(combosData?.combos, (value, key) => {
      const [raceAbbr, classAbbr, godName] = key.split(',')

      return {
        ...value,
        race: races.find((x) => x.abbr === raceAbbr),
        class: classes.find((x) => x.abbr === classAbbr),
        god: gods.find((x) => x.name === godName),
        winrate: (value.wins / value.total) * 100,
      }
    })

    return (
      <div className="flex flex-col gap-x-10 gap-y-4">
        <div className="grid grid-cols-1 gap-x-10 gap-y-4 md:grid-cols-1">
          <div className="space-y-1">
            <div className="flex justify-between gap-1">
              <h3 className="text-xl font-semibold">
                Top Players{' '}
                <span className="font-normal text-gray-600 dark:text-gray-400">(Last year)</span>
              </h3>
            </div>
            <TopList
              showFavorites
              top={topPlayersRecent}
              favorites={favorites}
              onLinkClick={onLinkClick}
            />
          </div>
          <div className="space-y-1">
            <div className="flex justify-between gap-1">
              <h3 className="text-xl font-semibold">
                Top Players{' '}
                <span className="font-normal text-gray-600 dark:text-gray-400">(All Time)</span>
              </h3>
            </div>
            <TopList top={topPlayers} onLinkClick={onLinkClick}>
              <List
                title="By win rate, %"
                afterTitle={
                  <span className="ml-auto text-right text-xs text-gray-400 dark:text-gray-500">
                    (min. {topPlayersWithManyGames.minGamesThresholdForWinrate} games)
                  </span>
                }
                items={topPlayersWithManyGames.byWinrate.map((item) => ({
                  name: item.name,
                  count: formatNumber(item.winrate * 100, {
                    maximumFractionDigits: 2,
                    minimumFractionDigits: 2,
                  }),
                }))}
                onLinkClick={onLinkClick}
              />
            </TopList>
          </div>

          {/* <hr className="md:hidden" /> */}

          {/* <div className="space-y-1 text-sm">
            <h2 className="flex gap-1 font-semibold">
              Popular picks in the last 7 days
              <HelpBubble content="Latest game version only" />
            </h2>
            <div className="space-y-2">
              <PopularList title="By wins" data={orderBy(popularPicksData, (x) => x.wins, 'desc')} />
              <PopularList
                title="By winrate"
                tooltip="Minimum 10 games played"
                data={orderBy(
                  popularPicksData.filter((x) => x.total > 10),
                  (x) => x.winrate,
                  'desc',
                )}
              />
              <PopularList
                title="By total amount of games"
                data={orderBy(popularPicksData, (x) => x.total, 'desc')}
              />
            </div>
          </div> */}
        </div>

        <Streams />

        <hr />

        <Table
          games={gamesByEndAt}
          title="Recent wins"
          highlight="Date"
          onLinkClick={onLinkClick}
        />
        <Table
          games={gamesByTC}
          title="Fastest wins by turn count"
          highlight="Turns"
          onLinkClick={onLinkClick}
        />
        <Table
          games={gamesByDuration}
          title="Fastest wins by realtime"
          highlight="Duration"
          onLinkClick={onLinkClick}
        />
        <Table
          games={gamesByScore3Runes}
          title="Top highscores (3 runes only)"
          highlight="Score"
          onLinkClick={onLinkClick}
        />
        <Table
          games={gamesByTC15Runes}
          title="Fastest wins by turn count (15 runes only)"
          highlight="Turns"
          onLinkClick={onLinkClick}
        />
        <Table
          games={gamesByDuration15Runes}
          title="Fastest wins by realtime (15 runes only)"
          highlight="Duration"
          onLinkClick={onLinkClick}
        />
        <Table
          games={gamesByScore}
          title="Top highscores"
          highlight="Score"
          onLinkClick={onLinkClick}
        />
      </div>
    )
  },
)

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const PopularList = ({
  title,
  data,
  tooltip,
}: {
  title: string
  data: NormalizedData
  tooltip?: string
}) => {
  return (
    <div>
      <div className="flex gap-1">
        <div className="font-semibold">{title}:</div>
        {tooltip && <HelpBubble content={tooltip} />}
      </div>
      <div>
        {data.slice(0, 7).map((x, index) => (
          <Link
            key={index}
            prefetch={false}
            href={{
              pathname: '/suggest',
              query: pickBy(
                {
                  race: x.race?.name,
                  class: x.class?.name,
                  god: x.god?.name,
                },
                (value) => Boolean(value),
              ),
            }}
            className="-mx-1 flex justify-between rounded-sm px-1 hover:bg-amber-100 dark:hover:bg-zinc-700"
          >
            <div>
              {x.race?.abbr}
              {x.class?.abbr} {x.god?.name && `of ${x.god?.name}`}
            </div>
            <WinrateStats small games={x.total} wins={x.wins} />
          </Link>
        ))}
      </div>
    </div>
  )
}

const TopList = ({
  top,
  favorites,
  showFavorites,
  onLinkClick,
  children,
}: PropsWithChildren<{
  top: Props['topPlayers']
  favorites?: string[] | null
  showFavorites?: boolean
  onLinkClick: (name: string) => void
}>) => {
  return (
    <div className="grid grid-cols-1 gap-x-10 gap-y-4 text-sm sm:grid-cols-2 md:grid-cols-4">
      <div className="space-y-2">
        <List
          title="By win rate, %"
          afterTitle={
            <span className="ml-auto text-right text-xs text-gray-400 dark:text-gray-500">
              (min. {top.minGamesThresholdForWinrate} games)
            </span>
          }
          items={top.byWinrate.map((item) => ({
            name: item.name,
            count: formatNumber(item.winrate * 100, {
              maximumFractionDigits: 2,
              minimumFractionDigits: 2,
            }),
          }))}
          onLinkClick={onLinkClick}
        />
        {top.gamesTotal != undefined && (
          <h2 className="flex justify-between font-semibold">
            Total games: <span>{formatNumber(top.gamesTotal)}</span>
          </h2>
        )}
      </div>
      <div className="space-y-2">
        <List
          title="By wins"
          items={top.byWins.map((item) => ({
            name: item.name,
            count: formatNumber(item.wins),
          }))}
          onLinkClick={onLinkClick}
        />
        {top.winsTotal != undefined && (
          <h2 className="flex justify-between font-semibold">
            Total wins: <span>{formatNumber(top.winsTotal)}</span>
          </h2>
        )}
      </div>

      <List
        title="By distinct titles earned"
        items={top.byTitles.map((item) => ({
          name: item.name,
          count: formatNumber(item.titles),
        }))}
        onLinkClick={onLinkClick}
      />

      {showFavorites && (
        <List
          title="Your favorites"
          placeholder={
            favorites && favorites.length === 0 ? (
              <div className="text-gray-400">
                Nobody added yet
                <div className="mt-1">
                  Use <span className="font-medium">star</span> icon on player page next to their
                  name
                </div>
                <div>Data is stored locally on your device</div>
              </div>
            ) : undefined
          }
          items={(favorites ?? []).map((name) => ({
            name,
          }))}
          onLinkClick={onLinkClick}
        />
      )}

      {children}
    </div>
  )
}
