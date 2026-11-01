import { Metadata } from 'next'
import { getStaticData } from '~/api/generated/axios'
import { sharedOGMetadata } from '~/app/shared-metadata'
import { defaultMetaTitle } from '~/constants'
import { SearchScreen } from '~/screens/Search'

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
  const data = await getStaticData({ adapter: 'fetch' })

  return <SearchScreen filterOptions={data.filterOptions} />
}
