import { range } from 'lodash-es'
import { Metadata } from 'next'
import { Suspense } from 'react'
import { sharedOGMetadata } from '~/app/shared-metadata'
import { Logo } from '~/components/Logo'
import { defaultMetaTitle } from '~/constants'
import { ServersList } from '~/screens/Servers/ServersList'

const title = `Servers | ${defaultMetaTitle}`

export const metadata: Metadata = {
  title,
  openGraph: {
    ...sharedOGMetadata,
    title,
  },
}

const ServersPage = () => {
  return (
    <div className="container mx-auto flex min-h-screen flex-col items-center space-y-4 py-4 pt-4">
      <header>
        <Logo />
      </header>

      <div className="w-full max-w-lg space-y-2">
        <Suspense
          fallback={
            <>
              <div className="h-7 w-full animate-pulse rounded bg-gray-200 dark:bg-zinc-700" />
              {range(15).map((i) => (
                <div
                  key={i}
                  className="h-[58px] w-full animate-pulse rounded bg-gray-200 dark:bg-zinc-700"
                />
              ))}
            </>
          }
        >
          <ServersList />
        </Suspense>
      </div>
    </div>
  )
}

export default ServersPage
