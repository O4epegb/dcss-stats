'use client'

import useSWRImmutable from 'swr/immutable'
import { fetchApi } from '~/api/server'

export const SupportGoalText = () => {
  const { data, error } = useSWRImmutable('/supporters/current', (url) =>
    fetchApi(url).then((r) => r.json()),
  )

  if (!data || error) {
    return null
  }

  return (
    <span className="text-2xs text-muted-foreground absolute top-full text-nowrap sm:text-xs">
      {data.total >= data.goal ? (
        <>Goal: done! (${data.total})</>
      ) : (
        <>
          Goal: ${data.total} of ${data.goal}
        </>
      )}
    </span>
  )
}
