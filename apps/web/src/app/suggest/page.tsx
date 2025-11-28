import { Metadata } from 'next'
import { Suspense } from 'react'
import { fetchApi } from '~/api/server'
import { sharedOGMetadata } from '~/app/shared-metadata'
import { defaultMetaTitle } from '~/constants'
import { SuggestScreen } from '~/screens/Suggest'
import { StaticData } from '~/types'

const title = `Suggest | ${defaultMetaTitle}`

export const metadata: Metadata = {
  title,
  openGraph: {
    ...sharedOGMetadata,
    title,
  },
}

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
