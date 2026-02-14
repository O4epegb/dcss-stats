import { Metadata } from 'next'
import { cacheLife } from 'next/cache'
import { fetchApi } from '~/api/server'
import { sharedOGMetadata } from '~/app/shared-metadata'
import { Logo } from '~/components/Logo'
import { defaultMetaTitle } from '~/constants'
import { LiveGamesResponse, LiveGamesTable } from '~/screens/main/LiveGames'

const title = `Live games | ${defaultMetaTitle}`

export const metadata: Metadata = {
  title,
  openGraph: {
    ...sharedOGMetadata,
    title,
  },
}

export default async function LiveGamesPage() {
  'use cache'

  cacheLife({
    stale: 20,
    revalidate: 30,
    expire: 120,
  })

  const response: LiveGamesResponse = await fetchApi(`/live-games`).then((r) => r.json())
  const { games } = response.data

  if (games.length === 0) {
    return null
  }

  return (
    <div className="container mx-auto flex min-h-dvh flex-col items-center px-4">
      <div className="w-full max-w-6xl space-y-4 py-4">
        <header>
          <Logo />
        </header>

        <LiveGamesTable games={games} />
      </div>
    </div>
  )
}
