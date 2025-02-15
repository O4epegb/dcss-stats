import { omit, flatten, last, isError } from 'lodash-es'
import useSWRInfinite from 'swr/infinite'
import { api } from '~/api'
import { Filter } from '~/components/Filters'
import { GameCard } from '~/components/GameCard'
import { Loader } from '~/components/ui/Loader'
import { Game } from '~/types'

export const GameList = (props: { filter: null | Filter[] }) => {
  const filter = props.filter?.map((item) => omit(item, 'id'))

  const { data, error, size, setSize } = useSWRInfinite(
    (pageIndex, previousPageData: { data: Game[]; count: number }) => {
      if (!filter || (previousPageData && previousPageData.data.length === 0)) {
        return null
      }

      return ['/search', { filter, after: last(previousPageData?.data)?.id }]
    },
    ([url, { filter, after }]) =>
      api
        .get<{ data: Game[]; count: number }>(url, { params: { filter, after } })
        .then((res) => res.data),
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      revalidateFirstPage: false,
    },
  )

  const games = data ? flatten(data.map((x) => x.data)) : []
  const isLoadingInitialData = !data && !error
  const isLoadingMore =
    isLoadingInitialData || (size > 0 && data && typeof data[size - 1] === 'undefined')
  const isEmpty = data?.[0].data?.length === 0
  const isReachingEnd = isEmpty || (data && data[data.length - 1]?.data?.length < 10)

  return (
    <div className="flex-1 py-2 pr-2">
      {isEmpty ? (
        <div className="flex items-center justify-center py-16">Nothing found ¯\_(ツ)_/¯</div>
      ) : (
        <ul className="space-y-2">
          {games.map((game) => {
            return (
              <li key={game.id}>
                <GameCard showSkills includePlayer game={game} />
              </li>
            )
          })}
        </ul>
      )}

      {!isEmpty && !error && (
        <div className="flex items-center justify-center pb-4 pt-8">
          <button
            className="flex items-center justify-center space-x-1"
            disabled={isLoadingMore || isReachingEnd}
            onClick={() => setSize(size + 1)}
          >
            <span>{isLoadingMore ? 'Loading' : isReachingEnd ? 'No more games' : 'Load more'}</span>
            {isLoadingMore && <Loader />}
          </button>
        </div>
      )}

      {isError(error) && (
        <div className="flex flex-col items-center justify-center gap-2 pb-4 pt-8">
          <div>Error occured, try to reload the page</div>
          {error.message && <code className="bg-gray-100 p-2">{error.message}</code>}
        </div>
      )}
    </div>
  )
}
