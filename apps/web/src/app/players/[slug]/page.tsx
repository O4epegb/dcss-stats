import { cookies } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import { fetchApi } from '~/api/server'
import PlayerPage from '~/screens/Player'
import { cookiesStoreDefault } from '~/screens/Player/utils'
import { PlayerInfoResponse } from '~/types'

async function getData(slug: string) {
  const response = await fetchApi(`/players/${slug}`, { cache: 'no-store' })

  if (response.ok) {
    const data: PlayerInfoResponse = await response.json()

    if (data.player.name !== slug) {
      redirect(`/players/${data.player.name}`)
    }

    return {
      ...data,
      cookiesStore: Object.keys(cookiesStoreDefault).reduce(
        (acc, key) => ({ ...acc, [key]: cookies().has(key) }),
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

export default async function Page({ params }: { params: { slug: string } }) {
  const data = await getData(params.slug)

  return <PlayerPage {...data} />
}
