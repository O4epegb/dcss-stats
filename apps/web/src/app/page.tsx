import { Suspense } from 'react'
import { MainPage } from '~/screens/main'

export default function Page(_props: PageProps<'/'>) {
  return (
    <Suspense>
      <MainPage />
    </Suspense>
  )
}
