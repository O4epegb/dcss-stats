import dayjs from 'dayjs'
import {
  // map,
  pickBy,
} from 'lodash-es'
import Link from 'next/link'
import { PropsWithChildren } from 'react'
import { fetchApi } from '~/api/server'
import { WinrateStats } from '~/components/WinrateStats'
import { HelpBubble } from '~/components/ui/Tooltip'
import { Class, God, Player, Race } from '~/types'
import { formatNumber } from '~/utils'
import { FavoritesList } from './FavoritesList'
import { HighscoreTables } from './HighscoreTables'
import { List } from './List'

type NormalizedData = {
  race: Race | undefined
  class: Class | undefined
  god: God | undefined
  winrate: number
  wins: number
  total: number
}[]

type TopPlayers = {
  gamesTotal: number
  winsTotal: number
  minGamesThresholdForWinrate: number
  byWins: Array<Pick<Player, 'name'> & { wins: number }>
  byWinrate: Array<Pick<Player, 'name'> & { winrate: number; games: number }>
  byTitles: Array<Pick<Player, 'name'> & { titles: number }>
}

export const Stats = async () => {
  'use cache'

  // const staticRes = await fetchApi('/static-data')
  // const staticData: StaticData = await staticRes.json()
  // const popularPicksData: NormalizedData = map(combosData?.combos, (value, key) => {
  //   const [raceAbbr, classAbbr, godName] = key.split(',')

  //   return {
  //     ...value,
  //     race: races.find((x) => x.abbr === raceAbbr),
  //     class: classes.find((x) => x.abbr === classAbbr),
  //     god: gods.find((x) => x.name === godName),
  //     winrate: (value.wins / value.total) * 100,
  //   }
  // })

  const topVeryRecentRes: { data: TopPlayers } = await fetchApi(
    `/top?minGamesThresholdForWinrate=15&since=${encodeURIComponent(dayjs().subtract(1, 'month').toISOString())}`,
  ).then((r) => r.json())

  const topRecentRes: { data: TopPlayers } = await fetchApi(
    `/top?minGamesThresholdForWinrate=27&since=${encodeURIComponent(dayjs().subtract(1, 'year').toISOString())}`,
  ).then((r) => r.json())

  const topRes: { data: TopPlayers } = await fetchApi('/top').then((r) => r.json())
  const topWithManyGamesRes: { data: TopPlayers } = await fetchApi(
    '/top?minGamesThresholdForWinrate=500',
  ).then((r) => r.json())

  return (
    <div className="flex flex-col gap-x-10 gap-y-4">
      <div className="grid grid-cols-1 gap-x-10 gap-y-4 md:grid-cols-1">
        <div className="space-y-1">
          <div className="flex justify-between gap-1">
            <h3 className="text-xl font-semibold">
              Top Players{' '}
              <span className="font-normal text-gray-600 dark:text-gray-400">(Last month)</span>
            </h3>
          </div>
          <TopList showFavorites top={topVeryRecentRes.data} />
        </div>

        <div className="space-y-1">
          <div className="flex justify-between gap-1">
            <h3 className="text-xl font-semibold">
              Top Players{' '}
              <span className="font-normal text-gray-600 dark:text-gray-400">(Last year)</span>
            </h3>
          </div>
          <TopList top={topRecentRes.data} />
        </div>

        <div className="space-y-1">
          <div className="flex justify-between gap-1">
            <h3 className="text-xl font-semibold">
              Top Players{' '}
              <span className="font-normal text-gray-600 dark:text-gray-400">(All Time)</span>
            </h3>
          </div>
          <TopList top={topRes.data}>
            <List
              title="By win rate, %"
              afterTitle={
                <span className="ml-auto text-right text-xs text-gray-400 dark:text-gray-500">
                  (min. {topWithManyGamesRes.data.minGamesThresholdForWinrate} games)
                </span>
              }
              items={topWithManyGamesRes.data.byWinrate.map((item) => ({
                name: item.name,
                secondaryCount: `${item.games}g`,
                count: formatNumber(item.winrate * 100, {
                  maximumFractionDigits: 2,
                  minimumFractionDigits: 2,
                }),
              }))}
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

      <hr />

      <HighscoreTables />
    </div>
  )
}

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
  showFavorites,
  children,
}: PropsWithChildren<{
  top: TopPlayers
  showFavorites?: boolean
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
            secondaryCount: `${item.games}g`,
            count: formatNumber(item.winrate * 100, {
              maximumFractionDigits: 2,
              minimumFractionDigits: 2,
            }),
          }))}
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
      />

      {showFavorites && <FavoritesList />}

      {children}
    </div>
  )
}
