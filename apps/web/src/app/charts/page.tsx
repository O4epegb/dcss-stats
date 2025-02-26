import { Suspense } from 'react'
import { fetchApi } from '~/api/server'
import type { Filter } from '~/components/Filters'
import { operators } from '~/components/Filters/constants'
import { ChartsScreen } from '~/screens/Charts'
import { StaticData } from '~/types'
import { getShortId } from '~/utils'

export const revalidate = 300
export const fetchCache = 'force-cache'

export default async function SearchPage() {
  const res = await fetchApi('/static-data')
  const data: StaticData = await res.json()

  if (!res.ok) {
    throw res
  }

  const raceFilterOption = data.filterOptions.find((x) => x.name === 'Race')

  const defaultDatasets = [
    {
      id: getShortId(),
      filters: [
        raceFilterOption
          ? ({
              id: getShortId(),
              condition: raceFilterOption.conditions[0],
              operator: operators[0],
              option: raceFilterOption.name,
              value: '',
              suboption: raceFilterOption.suboptions[0],
            } as Filter)
          : null,
      ].filter((x) => x !== null),
    },
  ]

  return (
    <Suspense fallback={null}>
      <ChartsScreen staticData={data} defaultDatasets={defaultDatasets} />
    </Suspense>
  )
}
