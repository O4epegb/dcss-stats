import { Suspense } from 'react'
import { fetchApi } from '~/api/server'
import { SuggestScreen } from '~/screens/Suggest'
import { StaticData } from '~/types'

export const revalidate = 300

export default async function SuggestPage() {
  const res = await fetchApi('/static-data', {
    cache: 'force-cache',
  })
  const data: StaticData = await res.json()

  if (!res.ok) {
    throw res
  }

  return (
    <div>
      <Suspense fallback={null}>
        <SuggestScreen {...data} />
      </Suspense>
    </div>
  )
}
