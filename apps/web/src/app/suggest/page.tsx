import { orderBy } from 'lodash-es'
import { Suspense } from 'react'
import { StaticData } from '~types'
import { fetchApi } from '~api/server'
import { SuggestScreen } from '../../screens/Suggest'

export const revalidate = 300

export default async function SuggestPage() {
  const data: StaticData = await fetchApi('/combos').then((r) => r.json())

  const props = {
    races: orderBy(data.races, [(x) => x.trunk, (x) => x.name], ['desc', 'asc']),
    classes: orderBy(data.classes, [(x) => x.trunk, (x) => x.name], ['desc', 'asc']),
    gods: orderBy(data.gods, (x) => x.name.toLowerCase()),
    skills: data.skills,
    versions: data.versions,
  }

  return (
    <div>
      <Suspense fallback={null}>
        <SuggestScreen {...props} />
      </Suspense>
    </div>
  )
}
