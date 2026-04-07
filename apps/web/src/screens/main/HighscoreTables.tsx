import { cacheLife } from 'next/cache'
import { memo, Suspense } from 'react'
import { fetchApi } from '~/api/server'
import { Game, HighscoresResponse } from '~/types'
import { Table } from './Table'

const take = 10

async function fetchHighscores(params: Record<string, string>): Promise<Game[]> {
  const fetchParams = new URLSearchParams({ ...params, take: String(take) })
  const res: HighscoresResponse = await fetchApi('/highscores?' + fetchParams.toString()).then(
    (r) => r.json(),
  )
  return res.data.map((entry) => entry.game)
}

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

  const [
    gamesByTC,
    gamesByDuration,
    gamesByScore,
    gamesByTC15Runes,
    gamesByDuration15Runes,
    gamesByScore3Runes,
  ] = await Promise.all([
    fetchHighscores({ kind: 'TURN_COUNT', runeTier: 'ALL', breakdown: 'CHAR' }),
    fetchHighscores({ kind: 'DURATION', runeTier: 'ALL', breakdown: 'CHAR' }),
    fetchHighscores({ kind: 'HIGHSCORE', runeTier: 'ALL', breakdown: 'CHAR' }),
    fetchHighscores({ kind: 'TURN_COUNT', runeTier: 'TIER_2', breakdown: 'CHAR' }),
    fetchHighscores({ kind: 'DURATION', runeTier: 'TIER_2', breakdown: 'CHAR' }),
    fetchHighscores({ kind: 'HIGHSCORE', runeTier: 'TIER_1', breakdown: 'CHAR' }),
  ])

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

  const res = await fetchApi('/main')
  const {
    data: { gamesByEndAt },
  }: {
    data: {
      gamesByEndAt: Array<Game>
    }
  } = await res.json()

  return <Table games={gamesByEndAt} title="Recent wins" highlight="Date" />
})
