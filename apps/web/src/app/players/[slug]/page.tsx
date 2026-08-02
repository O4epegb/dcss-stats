import { Metadata } from 'next'
import { cookies } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import { fetchApi } from '~/api/server'
import { defaultMetaDescription, defaultMetaTitle } from '~/constants'
import PlayerPage from '~/screens/Player'
import { cookiesStoreDefault } from '~/screens/Player/utils'
import { PlayerInfoResponse } from '~/types'
import { formatNumber } from '~/utils'

const serversQuery = (servers?: string) =>
  servers ? `?servers=${encodeURIComponent(servers)}` : ''

async function getPlayerData(slug: string, servers?: string) {
  const response = await fetchApi(`/players/${slug}${serversQuery(servers)}`)

  if (response.ok) {
    const data: PlayerInfoResponse = await response.json()

    if (data.player.name !== slug) {
      redirect(`/players/${data.player.name}${serversQuery(servers)}`)
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
  const [{ slug }, searchParams] = await Promise.all([props.params, props.searchParams])
  const servers = typeof searchParams.servers === 'string' ? searchParams.servers : undefined

  return <PageContent slug={slug} servers={servers} />
}

async function PageContent({ slug, servers }: { slug: string; servers?: string }) {
  const cookiesStoreData = await getCookieStoreData()
  const data = await getPlayerData(slug, servers)

  return <PlayerPage {...data} cookiesStore={cookiesStoreData} />
}

export async function generateMetadata(props: PageProps<'/players/[slug]'>): Promise<Metadata> {
  const [{ slug }, searchParams] = await Promise.all([props.params, props.searchParams])
  const servers = typeof searchParams.servers === 'string' ? searchParams.servers : undefined

  const response = await fetchApi(`/players/${slug}${serversQuery(servers)}`)

  if (response.ok) {
    const data: PlayerInfoResponse = await response.json()

    const wins = formatNumber(data.stats.total.wins)
    const games = formatNumber(data.stats.total.games)
    const winrate = formatNumber((data.stats.total.wins / data.stats.total.games || 0) * 100, {
      maximumFractionDigits: 2,
    })

    const filterSuffix = data.filter.servers ? ` on ${data.filter.servers.join(', ')}` : ''
    const title = `${data.player.name} | ${defaultMetaTitle}`
    const description = `${data.player.name} stats${filterSuffix} - ${wins}W ${games}G ${winrate}% WR | ${defaultMetaDescription}`

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
