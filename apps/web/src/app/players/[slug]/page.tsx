import { Metadata } from 'next'
import { cookies } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import { fetchApi } from '~/api/server'
import { defaultMetaDescription, defaultMetaTitle } from '~/constants'
import PlayerPage from '~/screens/Player'
import { cookiesStoreDefault } from '~/screens/Player/utils'
import { PlayerInfoResponse } from '~/types'
import { formatNumber } from '~/utils'

type Props = { params: Promise<{ slug: string }> }

async function getData(slug: string) {
  const response = await fetchApi(`/players/${slug}`)
  const cookieStore = await cookies()

  if (response.ok) {
    const data: PlayerInfoResponse = await response.json()

    if (data.player.name !== slug) {
      redirect(`/players/${data.player.name}`)
    }

    return {
      ...data,
      cookiesStore: Object.keys(cookiesStoreDefault).reduce(
        (acc, key) => ({ ...acc, [key]: cookieStore.has(key) }),
        {},
      ),
    }
  } else {
    if (response.status === 404) {
      notFound()
    } else {
      throw new Error(`Error: ${response.status}`)
    }
  }
}

export default async function Page(props: Props) {
  const params = await props.params
  const data = await getData(params.slug)

  return <PlayerPage {...data} />
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params

  const response = await fetchApi(`/players/${slug}`)

  if (response.ok) {
    const data: PlayerInfoResponse = await response.json()

    const wins = formatNumber(data.stats.total.wins)
    const games = formatNumber(data.stats.total.games)
    const winrate = formatNumber((data.stats.total.wins / data.stats.total.games || 0) * 100, {
      maximumFractionDigits: 2,
    })

    return {
      title: `${data.player.name} | ${defaultMetaTitle}`,
      description: `${data.player.name} stats - ${wins}W ${games}G ${winrate}% WR | ${defaultMetaDescription}`,
    }
  } else {
    return {
      title: `Player not found | ${defaultMetaTitle}`,
    }
  }
}
