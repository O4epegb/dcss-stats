import { Metadata } from 'next'
import { cacheLife } from 'next/cache'
import { cookies } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import { Suspense } from 'react'
import { fetchApi } from '~/api/server'
import { Loader } from '~/components/ui/Loader'
import { defaultMetaDescription, defaultMetaTitle } from '~/constants'
import PlayerPage from '~/screens/Player'
import { cookiesStoreDefault } from '~/screens/Player/utils'
import { PlayerInfoResponse } from '~/types'
import { formatNumber } from '~/utils'

async function getPlayerData(params: PageProps<'/players/[slug]'>['params']) {
  'use cache'

  cacheLife('seconds')

  const { slug } = await params

  const response = await fetchApi(`/players/${slug}`)

  if (response.ok) {
    const data: PlayerInfoResponse = await response.json()

    if (data.player.name !== slug) {
      redirect(`/players/${data.player.name}`)
    }

    return data
  } else {
    if (response.status === 404) {
      notFound()
    } else {
      throw new Error(`Error: ${response.status}`)
    }
  }
}

async function getCookieStoreData() {
  const cookieStore = await cookies()

  return Object.keys(cookiesStoreDefault).reduce(
    (acc, key) => ({ ...acc, [key]: cookieStore.has(key) }),
    {},
  )
}

export default async function Page(props: PageProps<'/players/[slug]'>) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh w-full flex-col items-center justify-center gap-4">
          <Loader />
          Loading player data
        </div>
      }
    >
      <PageContent {...props} />
    </Suspense>
  )
}

async function PageContent(props: PageProps<'/players/[slug]'>) {
  const cookiesStoreData = await getCookieStoreData()
  const data = await getPlayerData(props.params)

  return <PlayerPage {...data} cookiesStore={cookiesStoreData} />
}

export async function generateMetadata({
  params,
}: PageProps<'/players/[slug]'>): Promise<Metadata> {
  'use cache'

  cacheLife('seconds')

  const { slug } = await params

  const response = await fetchApi(`/players/${slug}`)

  if (response.ok) {
    const data: PlayerInfoResponse = await response.json()

    const wins = formatNumber(data.stats.total.wins)
    const games = formatNumber(data.stats.total.games)
    const winrate = formatNumber((data.stats.total.wins / data.stats.total.games || 0) * 100, {
      maximumFractionDigits: 2,
    })

    const title = `${data.player.name} | ${defaultMetaTitle}`
    const description = `${data.player.name} stats - ${wins}W ${games}G ${winrate}% WR | ${defaultMetaDescription}`

    return {
      title,
      description,
      openGraph: {
        title,
        description,
      },
    }
  } else {
    const title = `Player not found | ${defaultMetaTitle}`
    return {
      title,
      openGraph: {
        title,
      },
    }
  }
}
