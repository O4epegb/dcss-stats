import { Suspense } from 'react'
import { fetchApi } from '~/api/server'
import { SearchScreen } from '~/screens/Search'
import { StaticData } from '~/types'

export const revalidate = 300

export default async function SearchPage() {
  const res = await fetchApi('/static-data')
  const data: StaticData = await res.json()

  if (!res.ok) {
    throw res
  }

  return (
    <Suspense fallback={null}>
      <SearchScreen filterOptions={data.filterOptions} />
    </Suspense>
  )
}
