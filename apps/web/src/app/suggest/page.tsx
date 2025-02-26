import { Suspense } from 'react'
import { fetchApi } from '~/api/server'
import { SuggestScreen } from '~/screens/Suggest'
import { StaticData } from '~/types'

export const revalidate = 300
export const fetchCache = 'force-cache'

export default async function SuggestPage() {
  const res = await fetchApi('/static-data')
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
