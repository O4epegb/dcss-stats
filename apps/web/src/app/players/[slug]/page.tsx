import { cookies } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import { fetchApi } from '~/api/server'
import PlayerPage from '~/screens/Player'
import { cookiesStoreDefault } from '~/screens/Player/utils'
import { PlayerInfoResponse } from '~/types'

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

export default async function Page(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params
  const data = await getData(params.slug)

  return <PlayerPage {...data} />
}
