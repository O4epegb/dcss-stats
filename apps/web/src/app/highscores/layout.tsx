import { Suspense } from 'react'
import { HeaderWithMenu } from '~/components/HeaderWithMenu'
import { PageTabs } from './PageTabs'

export default function HighscoresLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col items-center space-y-8 p-4">
      <HeaderWithMenu />

      <div className="w-full max-w-5xl space-y-2">
        <PageTabs />
        <Suspense
          fallback={
            <div className="space-y-2">
              {[...Array(20)].map((_, i) => (
                <div
                  key={i}
                  className="h-10 w-full animate-pulse rounded-sm bg-gray-200 dark:bg-gray-700"
                />
              ))}
            </div>
          }
        >
          {children}
        </Suspense>
      </div>
    </div>
  )
}
