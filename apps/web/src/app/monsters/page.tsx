import type { MonsterCatalog } from '@dcss-stats/extractor/monsterCatalog'
import { range } from 'lodash-es'
import { Metadata } from 'next'
import { Suspense } from 'react'
import { fetchApi } from '~/api/server'
import { sharedOGMetadata } from '~/app/shared-metadata'
import { Logo } from '~/components/Logo'
import { ThemeSelector } from '~/components/ThemeSelector'
import { defaultMetaTitle } from '~/constants'
import { MonsterTable } from '~/screens/Monsters/MonsterTable'

const title = `Monsters | ${defaultMetaTitle}`

export const metadata: Metadata = {
  title,
  openGraph: {
    ...sharedOGMetadata,
    title,
  },
}

function Skeleton() {
  return (
    <div className="space-y-2">
      <div className="h-10 w-full animate-pulse rounded bg-gray-200 dark:bg-zinc-700" />
      <div className="h-4 w-32 animate-pulse rounded bg-gray-200 dark:bg-zinc-700" />
      {range(10).map((i) => (
        <div key={i} className="h-10 w-full animate-pulse rounded bg-gray-200 dark:bg-zinc-700" />
      ))}
    </div>
  )
}

async function MonstersContent() {
  const res = await fetchApi('/monsters')
  const catalog: MonsterCatalog = await res.json()

  if (!res.ok) {
    throw res
  }

  return <MonsterTable monsters={catalog.monsters} />
}

export default function MonstersPage() {
  return (
    <div className="container mx-auto flex min-h-screen flex-col items-center space-y-4 px-4 py-4">
      <header className="flex w-full max-w-7xl items-center gap-4">
        <Logo />
        <ThemeSelector className="ml-auto" />
      </header>

      <div className="w-full max-w-7xl space-y-4">
        <h2 className="text-xl font-semibold">Monster Catalog</h2>

        <Suspense fallback={<Skeleton />}>
          <MonstersContent />
        </Suspense>
      </div>
    </div>
  )
}
