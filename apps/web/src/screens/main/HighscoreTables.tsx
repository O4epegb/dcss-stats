import { cacheLife } from 'next/cache'
import { memo, Suspense } from 'react'
import { fetchApi } from '~/api/server'
import { Game } from '~/types'
import { Table } from './Table'

export const HighscoreTables = () => {
  return (
    <>
      <Suspense fallback={null}>
        <RecentWinsTable />
      </Suspense>
      <Suspense fallback={null}>
        <RestTables />
      </Suspense>
    </>
  )
}

export const RestTables = memo(async () => {
  'use cache'

  cacheLife('days')

  const res = await fetchApi('/main?highscores=true')
  const {
    data: {
      gamesByTC,
      gamesByDuration,
      gamesByScore,
      gamesByTC15Runes,
      gamesByDuration15Runes,
      gamesByScore3Runes,
    },
  }: {
    data: {
      gamesByTC: Array<Game>
      gamesByDuration: Array<Game>
      gamesByScore: Array<Game>
      gamesByTC15Runes: Array<Game>
      gamesByDuration15Runes: Array<Game>
      gamesByScore3Runes: Array<Game>
    }
  } = await res.json()

  return (
    <>
      <Table games={gamesByTC} title="Fastest wins by turn count" highlight="Turns" />
      <Table games={gamesByDuration} title="Fastest wins by realtime" highlight="Duration" />
      <Table games={gamesByScore3Runes} title="Top highscores (3 runes only)" highlight="Score" />
      <Table
        games={gamesByTC15Runes}
        title="Fastest wins by turn count (15 runes only)"
        highlight="Turns"
      />
      <Table
        games={gamesByDuration15Runes}
        title="Fastest wins by realtime (15 runes only)"
        highlight="Duration"
      />
      <Table games={gamesByScore} title="Top highscores" highlight="Score" />
    </>
  )
})

const RecentWinsTable = memo(async () => {
  'use cache'

  const res = await fetchApi('/main?recentWins=true')
  const {
    data: { gamesByEndAt },
  }: {
    data: {
      gamesByEndAt: Array<Game>
    }
  } = await res.json()

  return <Table games={gamesByEndAt} title="Recent wins" highlight="Date" />
})
