import { useState } from 'react'
import { GetStaticProps } from 'next'
import { orderBy, last, flatten, first, omit, isError } from 'lodash-es'
import useSWRInfinite from 'swr/infinite'
import { api } from '~api'
import { Game, StaticData } from '~types'
import { formatNumber } from '~utils'
import { createServerApi } from '~api/server'
import { Logo } from '~components/Logo'
import { Loader } from '~components/ui/Loader'
import { GameItem } from '~components/GameItem'
import { Filter, Filters } from '~components/Filters'
import { HelpBubble } from '~components/ui/Tooltip'

// Order by
// Hotkey for submit
// Add killer filter
// gold, potions, scrolls filter?
// send options from BE
// send maximum filters from the backend

const SearchPage = ({ races, classes, gods, skills, versions }: Props) => {
  const [filterForSearch, setFilterForSearch] = useState<Filter[] | null>(() => null)

  const { data, error, size, setSize } = useSWRInfinite(
    (pageIndex, previousPageData: { data: Game[]; count: number }) => {
      if (!filterForSearch || (previousPageData && previousPageData.data.length === 0)) {
        return null
      }

      return ['/search', { filter: filterForSearch, after: last(previousPageData?.data)?.id }]
    },
    ([url, { filter, after }]) =>
      api
        .get<{ data: Game[]; count: number }>(url, {
          params: { filter: filter.map((x: Filter) => omit(x, 'id')), after },
        })
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
    <div className="container mx-auto flex h-screen max-h-screen min-h-screen flex-col space-y-4 px-4 pb-4 pt-4">
      <header className="flex items-center gap-4 divide-x">
        <Logo />
        <h2 className="pl-4 text-2xl">Search</h2>
      </header>
      <div className="grid min-h-0 flex-1 gap-4 sm:grid-cols-2">
        <div className="space-y-4">
          <Filters
            races={races}
            classes={classes}
            gods={gods}
            skills={skills}
            versions={versions}
            onInit={(filters) => setFilterForSearch(filters)}
            onSubmit={(filters) => setFilterForSearch(filters)}
          />
        </div>

        <div className="flex min-h-0 flex-col">
          <div className="flex items-center gap-1">
            <div className="text-xl">Total: {formatNumber(first(data)?.count ?? 0)}</div>
            <HelpBubble content="Approximate number, may differ from the main page" />
          </div>
          <div className="flex-1 py-2 pr-2 sm:overflow-y-auto">
            {isEmpty ? (
              <div className="flex items-center justify-center py-16">Nothing found ¯\_(ツ)_/¯</div>
            ) : (
              <ul className="space-y-2">
                {games.map((game) => {
                  return (
                    <li key={game.id}>
                      <GameItem showSkills includePlayer game={game} />
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
                  <span>
                    {isLoadingMore ? 'Loading' : isReachingEnd ? 'No more games' : 'Load more'}
                  </span>
                  {isLoadingMore && <Loader />}
                </button>
              </div>
            )}

            {isError(error) && (
              <div className="flex flex-col items-center justify-center gap-2 pb-4 pt-8">
                <div>Error occured, try to reload the page</div>
                {error.message && (
                  <code className="bg-gray-100 p-2 dark:bg-zinc-700">{error.message}</code>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

type Props = Response

type Response = StaticData

export const getStaticProps: GetStaticProps<Props> = async () => {
  const { data } = await createServerApi().api.get<Response>('/combos')

  return {
    revalidate: 300,
    props: {
      races: orderBy(data.races, [(x) => x.trunk, (x) => x.name], ['desc', 'asc']),
      classes: orderBy(data.classes, [(x) => x.trunk, (x) => x.name], ['desc', 'asc']),
      gods: orderBy(data.gods, (x) => x.name.toLowerCase()),
      skills: data.skills,
      versions: data.versions,
    },
  }
}

export default SearchPage
