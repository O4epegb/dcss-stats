import { notFound, redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { PlayerInfoResponse } from '@types'
import { fetchApi } from '@api/server'
import { cookiesStore } from '@screens/Player/utils'
import PlayerPage from '@screens/Player'

async function getData(slug: string) {
  const response = await fetchApi(`/players/${slug}`, { cache: 'no-store' })

  if (response.ok) {
    const data: PlayerInfoResponse = await response.json()

    if (data.player.name !== slug) {
      redirect(`/players/${data.player.name}`)
    }

    return {
      ...data,
      cookiesStore: Object.keys(cookiesStore).reduce(
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
