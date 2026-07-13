import type { MonsterCatalog } from '@dcss-stats/extractor/monsterCatalog'
import { range } from 'lodash-es'
import { Metadata } from 'next'
import { Suspense } from 'react'
import { fetchApi } from '~/api/server'
import { sharedOGMetadata } from '~/app/shared-metadata'
import { HeaderWithMenu } from '~/components/HeaderWithMenu'
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

  return (
    <div className="space-y-3">
      {catalog.crawlVersion && catalog.crawlCommit && (
        <div className="text-xs text-gray-500 dark:text-zinc-400">
          Based on crawl {catalog.crawlVersion} (
          <a
            href={`https://github.com/crawl/crawl/tree/${catalog.crawlCommit}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-gray-700 dark:hover:text-zinc-200"
          >
            {catalog.crawlCommit.slice(0, 10)}
          </a>
          )
        </div>
      )}
      <MonsterTable monsters={catalog.monsters} crawlCommit={catalog.crawlCommit} />
    </div>
  )
}

export default function MonstersPage() {
  return (
    <div className="container mx-auto flex min-h-screen w-full max-w-7xl flex-col items-center space-y-4 px-4 py-4">
      <HeaderWithMenu />

      <div className="w-full space-y-4">
        <h2 className="text-xl font-semibold">Monster Catalog</h2>

        <Suspense fallback={<Skeleton />}>
          <MonstersContent />
        </Suspense>
      </div>
    </div>
  )
}
