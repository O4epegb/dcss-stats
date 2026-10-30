import { Metadata } from 'next'
import { fetchApi } from '~/api/server'
import { sharedOGMetadata } from '~/app/shared-metadata'
import { defaultMetaTitle } from '~/constants'
import { SearchScreen } from '~/screens/Search'
import { StaticData } from '~/types'

const title = `Search | ${defaultMetaTitle}`

export const instant = false

export const metadata: Metadata = {
  title,
  openGraph: {
    ...sharedOGMetadata,
    title,
  },
}

export default async function SearchPage() {
  const res = await fetchApi('/static-data')
  const data: StaticData = await res.json()

  if (!res.ok) {
    throw res
  }

  return <SearchScreen filterOptions={data.filterOptions} />
}
