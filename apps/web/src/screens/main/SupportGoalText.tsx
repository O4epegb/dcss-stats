import { fetchApi } from '~/api/server'
import { SupportersCurrentResponse } from '~/types'

export const SupportGoalText = async () => {
  'use cache'

  const data: SupportersCurrentResponse = await fetchApi('/supporters/current').then((r) =>
    r.json(),
  )

  return (
    <span className="text-2xs absolute top-full text-nowrap text-gray-400 sm:text-xs">
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
