'use client'

import ErrorPage from 'next/error'
import { useEffect } from 'react'
import { notify } from '~/utils/bugsnag'

export default function Error({ error }: { error: Error; reset: () => void }) {
  useEffect(() => {
    notify(error)
  }, [])

  return <ErrorPage statusCode={500} />
}
