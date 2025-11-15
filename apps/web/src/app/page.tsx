import { Suspense } from 'react'
import { MainPage } from '~/screens/main'

export default async function Page(_props: PageProps<'/'>) {
  'use cache'

  return (
    <Suspense>
      <MainPage />
    </Suspense>
  )
}
