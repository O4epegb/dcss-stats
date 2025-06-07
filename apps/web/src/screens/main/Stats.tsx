import { map, orderBy, pickBy } from 'lodash-es'
import Link from 'next/link'
import { useState, memo, useEffect } from 'react'
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
    wins,
    games,
    top,
    races,
    classes,
    gods,
    combosData,
    onLinkClick,
  }: Props & { onLinkClick: (name: string) => void }) => {
    const [favorites, setFavorites] = useState<null | string[]>(null)

    useEffect(() => {
      setFavorites(getFavorites().split(',').filter(Boolean))
    }, [])

    const data: NormalizedData = map(combosData.combos, (value, key) => {
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
        <div className="grid grid-cols-1 gap-x-10 gap-y-4 md:grid-cols-2">
          <div className="grid grid-cols-2 gap-x-10 gap-y-4 text-sm">
            <List
              title="Top by win rate, %"
              tooltip="Minimum 75 games played"
              items={top.byWinrate.map((item) => ({
                name: item.name,
                count: formatNumber(item.winrate * 100, {
                  maximumFractionDigits: 2,
                  minimumFractionDigits: 2,
                }),
              }))}
              onLinkClick={onLinkClick}
            />
            <List
              title="Top by wins"
              items={top.byWins.map((item) => ({
                name: item.name,
                count: formatNumber(item.wins),
              }))}
              onLinkClick={onLinkClick}
            />

            <h2 className="flex justify-between font-semibold">
              Total games: <span>{formatNumber(games)}</span>
            </h2>
            <h2 className="flex justify-between font-semibold">
              Total wins: <span>{formatNumber(wins)}</span>
            </h2>

            <List
              title="Top by distinct titles earned"
              items={top.byTitles.map((item) => ({
                name: item.name,
                count: formatNumber(item.titles),
              }))}
              onLinkClick={onLinkClick}
            />

            <List
              title="Your favorites"
              placeholder={
                favorites && favorites.length === 0 ? (
                  <div className="text-gray-400">
                    Nobody added yet
                    <div className="mt-1">
                      Use <span className="font-medium">star</span> icon on player page next to
                      their name
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
          </div>

          <hr className="md:hidden" />

          <div className="space-y-1 text-sm">
            <h2 className="flex gap-1 font-semibold">
              Popular picks in the last 7 days
              <HelpBubble content="Latest game version only" />
            </h2>
            <div className="space-y-2">
              <PopularList title="By wins" data={orderBy(data, (x) => x.wins, 'desc')} />
              <PopularList
                title="By winrate"
                tooltip="Minimum 10 games played"
                data={orderBy(
                  data.filter((x) => x.total > 10),
                  (x) => x.winrate,
                  'desc',
                )}
              />
              <PopularList
                title="By total amount of games"
                data={orderBy(data, (x) => x.total, 'desc')}
              />
            </div>
          </div>
        </div>

        <Streams />

        <hr />

        <Table
          games={top.gamesByEndAt}
          title="Recent wins"
          highlight="Date"
          onLinkClick={onLinkClick}
        />
        <Table
          games={top.gamesByTC}
          title="Fastest wins by turn count"
          highlight="Turns"
          onLinkClick={onLinkClick}
        />
        <Table
          games={top.gamesByDuration}
          title="Fastest wins by realtime"
          highlight="Duration"
          onLinkClick={onLinkClick}
        />
        <Table
          games={top.gamesByScore3Runes}
          title="Top highscores (3 runes only)"
          highlight="Score"
          onLinkClick={onLinkClick}
        />
        <Table
          games={top.gamesByTC15Runes}
          title="Fastest wins by turn count (15 runes only)"
          highlight="Turns"
          onLinkClick={onLinkClick}
        />
        <Table
          games={top.gamesByDuration15Runes}
          title="Fastest wins by realtime (15 runes only)"
          highlight="Duration"
          onLinkClick={onLinkClick}
        />
        <Table
          games={top.gamesByScore}
          title="Top highscores"
          highlight="Score"
          onLinkClick={onLinkClick}
        />
      </div>
    )
  },
)

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
