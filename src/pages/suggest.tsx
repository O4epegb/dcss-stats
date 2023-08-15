import { useState, useEffect } from 'react'
import clsx from 'clsx'
import { GetStaticProps } from 'next'
import useSWRImmutable from 'swr/immutable'
import useSWRInfinite from 'swr/infinite'
import {
  capitalize,
  flow,
  map,
  orderBy,
  every,
  castArray,
  pickBy,
  groupBy,
  noop,
  omit,
  filter as _filter,
  isEmpty,
  flatten,
  last,
  isError,
} from 'lodash-es'
import { useRouter } from 'next/router'
import { api } from '@api'
import { formatNumber, notEmpty } from '@utils'
import { Class, Game, God, Race, StaticData } from '@types'
import { createServerApi } from '@api/server'
import { Logo } from '@components/Logo'
import { WinrateStats } from '@components/WinrateStats'
import { Loader } from '@components/ui/Loader'
import { Tooltip } from '@components/ui/Tooltip'
import { Filter, Filters, filtersToQuery } from '@components/Filters'
import { GameItem } from '@components/GameItem'
import { useLocalStorageValue } from '@react-hookz/web'
import { Select } from '@components/ui/Select'

enum FilterValue {
  Any = 'any',
}

type Stats = { wins: number; total: number }
type Combos = Record<string, Stats>
type SuggestResponse = Stats & { combos: Combos }
type Data = SuggestResponse & { race?: Race; class?: Class; god?: God; version?: string }

type MainFilter = {
  race: string
  class: string
  god: string
  version: string
}

const SuggestPage = ({ versions, races, classes, gods, skills }: Props) => {
  type SortingKey = keyof ReturnType<typeof normalizeData>[number]

  const router = useRouter()

  const { value: showAdvancedFilters, set: setShowAdvancedFilters } = useLocalStorageValue(
    'showAdvancedFilters',
    {
      defaultValue: false,
      initializeWithValue: false,
    },
  )
  const { value: showWins, set: setShowWins } = useLocalStorageValue('showWins', {
    defaultValue: true,
    initializeWithValue: false,
  })
  const { value: groupingKey, set: setGroupingKey } = useLocalStorageValue<
    undefined | keyof Omit<typeof filter, 'version'>
  >('groupingKey', {
    defaultValue: undefined,
  })

  const [view, setView] = useState<'stats' | 'games'>('stats')
  const [sorting, setSorting] = useState<{ key: SortingKey; direction: 'desc' | 'asc' }>(() => ({
    key: 'total',
    direction: 'desc',
  }))
  const [advancedFilter, setAdvancedFilter] = useState<Filter[] | null>(() => null)
  const [filter, setFilter] = useState<MainFilter>(() => ({
    race: FilterValue.Any,
    class: FilterValue.Any,
    god: FilterValue.Any,
    version: versions[0],
  }))
  const [filterForSearch, setFilterForSearch] = useState(() => ({
    ...filter,
    advanced: [] as Filter[],
  }))

  const changeFilter = (key: keyof typeof filter, value: string) => {
    setFilter((current) => ({ ...current, [key]: value }))
  }

  useEffect(() => {
    if (!router.isReady) {
      return
    }

    const [qRace, qClass, qGod, qVersion] = [
      router.query.race,
      router.query.class,
      router.query.god,
      router.query.version,
    ].map((x) => castArray(x)[0])

    const race = races.find((x) => x.name === qRace)
    const klass = classes.find((x) => x.name === qClass)
    const god = gods.find((x) => x.name === qGod)
    const version = versions.find((x) => x === qVersion)

    const somethingIsInvalid = [
      [qRace, race],
      [qClass, klass],
      [qGod, god],
      [qVersion, version],
    ].some(([qItem, item]) => qItem && !item)

    if (somethingIsInvalid) {
      router.replace({
        query: {},
      })

      return
    }

    const newFilter = {
      race: race?.name || FilterValue.Any,
      class: klass?.name || FilterValue.Any,
      god: god?.name || FilterValue.Any,
      version: version || versions[0],
    } as const

    setFilter(newFilter)

    if (!every(omit(newFilter, 'version'), (value) => value === FilterValue.Any)) {
      setFilterForSearch((x) => ({ ...x, ...newFilter }))
    }
  }, [router.isReady])

  const buttonEnabled = _filter(filter, (value) => value !== FilterValue.Any).length > 1

  const filterData = {
    race: races.find((x) => x.name === filterForSearch.race),
    class: classes.find((x) => x.name === filterForSearch.class),
    god: gods.find((x) => x.name === filterForSearch.god),
  } as const
  const { race, class: klass, god } = filterData

  const onlyOneFilterWasSelected = [race, klass, god].filter(notEmpty).length === 1

  const columns = [
    [
      'Race',
      'race',
      'text',
      Boolean(!race && (!groupingKey || groupingKey === 'race' || filterData[groupingKey])),
    ],
    [
      'Class',
      'class',
      'text',
      Boolean(!klass && (!groupingKey || groupingKey === 'class' || filterData[groupingKey])),
    ],
    [
      'God',
      'god',
      'text',
      Boolean(!god && (!groupingKey || groupingKey === 'god' || filterData[groupingKey])),
    ],
    ['Games', 'total', 'numeric'],
    ['Wins', 'wins', 'numeric'],
    ['Win rate', 'winrate', 'numeric'],
  ] as Array<[string, SortingKey, 'numeric' | 'text', boolean?]>

  const { data, error, isValidating } = useSWRImmutable(
    () => {
      const mainParams = pickBy(
        {
          race: race?.abbr,
          class: klass?.abbr,
          god: god?.name,
        },
        (value) => value,
      )

      if (isEmpty(mainParams) || !advancedFilter) {
        return null
      }

      return [
        '/suggest',
        {
          ...mainParams,
          version: filterForSearch.version,
          filter: filterForSearch.advanced.map((x) => omit(x, 'id')),
        },
      ]
    },
    ([url, params]) => api.get<SuggestResponse>(url, { params }).then((res) => res.data),
  )

  const normalizeData = ({ combos, race, class: klass, god }: Data) => {
    let data = map(combos, (value, key) => {
      const [raceAbbr, classAbbr, godName] = key.split(',')

      return {
        ...value,
        race: race || races.find((x) => x.abbr === raceAbbr),
        class: klass || classes.find((x) => x.abbr === classAbbr),
        god: god || gods.find((x) => x.name === godName),
        winrate: (value.wins / value.total) * 100,
      }
    })

    if (groupingKey && !filterData[groupingKey]) {
      const grouped = groupBy(data, (x) => x[groupingKey]?.name)
      data = map(grouped, (items) => {
        return items.reduce((acc, item) => {
          const wins = acc.wins + item.wins
          const total = acc.total + item.total
          const winrate = (wins / total || 0) * 100

          return {
            ...acc,
            wins,
            total,
            winrate,
          }
        })
      })
    }

    return data
  }

  const isLoading = !data && !error && isValidating

  return (
    <div
      className={clsx(
        'container mx-auto flex min-h-screen flex-col items-center space-y-4 px-4 pb-8 pt-8',
        !race && !klass && !god && 'md:justify-center md:pt-0',
      )}
    >
      <header>
        <Logo />
      </header>
      <div className="m-auto w-full max-w-md rounded bg-blue-100 px-2 py-1 text-sm text-black">
        <span className="font-semibold">TL;DR:</span> pick race, class, or god that you want to play
        (or any combination of them). Hit the button to see win rate of your combo, as well as games
        of other players.
        <br />
        <br />
        This tool is under development, with bugs and suggestions DM @totalnoob on{' '}
        <a
          href="https://discord.gg/pKCNTunFeW"
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
        >
          RL Discord
        </a>
      </div>
      <div className="flex w-full flex-wrap gap-2 md:justify-center">
        I want to play
        <Select value={filter.race} onChange={(e) => changeFilter('race', e.target.value)}>
          <option value={FilterValue.Any}>any race</option>
          {races
            .filter((x) => x.trunk)
            .map(({ name }) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
        </Select>
        <Select value={filter.class} onChange={(e) => changeFilter('class', e.target.value)}>
          <option value={FilterValue.Any}>some class</option>
          {classes
            .filter((x) => x.trunk)
            .map(({ name }) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
        </Select>
        and
        <Select value={filter.god} onChange={(e) => changeFilter('god', e.target.value)}>
          <option value={FilterValue.Any}>whatever god</option>
          {gods
            .filter((x) => x.trunk)
            .map(({ name }) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
        </Select>
      </div>

      <div className="m-auto flex w-full max-w-lg items-center gap-2">
        <button
          className="-ml-2 flex items-center gap-1 rounded px-2 py-1 text-sm hover:bg-gray-100 dark:hover:bg-zinc-700"
          onClick={() => setShowAdvancedFilters((x) => !x)}
        >
          {showAdvancedFilters ? 'Hide' : 'Show'} advanced filters{' '}
          {advancedFilter && advancedFilter.length > 0 && (
            <div className="rounded-full bg-gray-800 px-2 text-xs text-white">
              {advancedFilter.length}
            </div>
          )}
        </button>
        <Select
          className="ml-auto"
          value={filter.version}
          onChange={(e) => changeFilter('version', e.target.value)}
        >
          {versions.map((version) => (
            <option key={version} value={version}>
              v{version}
            </option>
          ))}
        </Select>
      </div>

      <div className={clsx('space-y-4', !showAdvancedFilters && 'hidden')}>
        <hr />
        <Filters
          excludeFilters={['Class', 'Race', 'God', 'End', 'Player']}
          skills={skills}
          onInit={(filters) => {
            setAdvancedFilter(filters)
            setFilterForSearch((x) => ({ ...x, advanced: filters }))
          }}
          onFiltersChange={setAdvancedFilter}
        />
      </div>

      <div className="m-auto flex w-full max-w-lg items-center justify-center gap-2">
        <Tooltip disabled={buttonEnabled} content="Select at least one option from Race/Class/God">
          <button
            type="button"
            className={clsx(
              'flex items-center gap-x-2 rounded border bg-gray-800 px-4 py-2 text-white transition-colors',
              buttonEnabled && 'hover:bg-gray-700',
            )}
            onClick={() => {
              if (!buttonEnabled) {
                return
              }

              setFilterForSearch({ ...filter, advanced: advancedFilter ?? [] })

              router.replace(
                {
                  query: pickBy(
                    {
                      race: filter.race,
                      class: filter.class,
                      god: filter.god,
                      version: filter.version,
                      filter: advancedFilter ? filtersToQuery(advancedFilter) : FilterValue.Any,
                    },
                    (value) => value !== FilterValue.Any,
                  ),
                },
                undefined,
                { shallow: true },
              )
            }}
          >
            Time to have some fun!
            {isLoading && <Loader />}
          </button>
        </Tooltip>
      </div>

      {data && (
        <>
          <div className="m-auto w-full max-w-lg space-y-2">
            <hr />
            <h2 className="text-center text-xl">
              {race?.name || 'Something'} {klass?.name || 'Something'}{' '}
              <span className="font-light">of</span> {god?.name || 'Something'}
            </h2>
            <section className="flex justify-center">
              <WinrateStats games={data.total} wins={data.wins} />
            </section>
          </div>
          {data.total === 0 && (
            <div>
              {data.total === 0 && 'No games recorded for this combination, try another one'}
            </div>
          )}
          {data.total > 0 && columns && (
            <>
              <section className="m-auto flex w-full max-w-lg flex-wrap items-center justify-between">
                {view === 'stats' && onlyOneFilterWasSelected && (
                  <div className="flex w-full gap-4">
                    {(
                      [
                        ['race', race],
                        ['class', klass],
                        ['god', god],
                      ] as const
                    ).map(
                      ([key, isHidden]) =>
                        !isHidden && (
                          <label
                            key={key}
                            className={clsx('flex cursor-pointer items-center gap-1')}
                          >
                            <input
                              type="radio"
                              className="cursor-pointer"
                              checked={groupingKey === key}
                              onChange={noop}
                              onClick={() => setGroupingKey((x) => (x === key ? undefined : key))}
                            />
                            Group by {key}
                          </label>
                        ),
                    )}
                  </div>
                )}
                <label className="flex cursor-pointer items-center gap-1">
                  <input
                    checked={showWins}
                    className="cursor-pointer"
                    type="checkbox"
                    onChange={(e) => setShowWins(e.target.checked)}
                  />
                  Show only games with wins
                </label>
                <div className="group flex rounded-lg bg-gray-100 p-0.5 transition-colors hover:bg-gray-200 dark:bg-zinc-700 dark:hover:bg-zinc-600">
                  {(['stats', 'games'] as const).map((item) => (
                    <button
                      key={item}
                      className="flex rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-100"
                      onClick={() => setView(item)}
                    >
                      <span
                        className={clsx(
                          'rounded-md p-1.5 text-sm font-medium lg:pl-2.5 lg:pr-2.5',
                          view === item &&
                            'bg-white shadow-sm ring-1 ring-black ring-opacity-5 dark:bg-zinc-500',
                        )}
                      >
                        <span
                          className={clsx(
                            view === item
                              ? 'text-gray-900 dark:text-white'
                              : 'text-gray-600 group-hover:text-gray-900 dark:text-gray-300 dark:group-hover:text-white',
                          )}
                        >
                          {capitalize(item)}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              </section>
              <section className="m-auto w-full max-w-lg overflow-x-auto xl:overflow-x-visible">
                {view === 'stats' ? (
                  <table className="w-full table-auto">
                    <thead>
                      <tr>
                        {columns.map(
                          ([title, sortingKey, type, isVisible = true]) =>
                            isVisible && (
                              <th
                                key={title}
                                className={clsx(type === 'numeric' ? 'text-right' : 'text-left')}
                              >
                                <div
                                  className="inline-flex cursor-pointer select-none items-center whitespace-nowrap"
                                  onClick={() =>
                                    setSorting({
                                      key: sortingKey,
                                      direction:
                                        sorting.key === sortingKey
                                          ? sorting.direction === 'desc'
                                            ? 'asc'
                                            : 'desc'
                                          : sorting.direction,
                                    })
                                  }
                                >
                                  {title}

                                  {sorting.key === sortingKey && (
                                    <button>
                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className={clsx(
                                          'h-5 w-5 transition-transform',
                                          sorting.direction === 'asc' ? 'rotate-180' : '',
                                        )}
                                        viewBox="0 0 20 20"
                                        fill="currentColor"
                                      >
                                        <path
                                          fillRule="evenodd"
                                          d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                          clipRule="evenodd"
                                        />
                                      </svg>
                                    </button>
                                  )}
                                </div>
                              </th>
                            ),
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {flow(
                        () => normalizeData(data),
                        (x) =>
                          orderBy(
                            x,
                            (x) => {
                              const data = x[sorting.key]

                              return typeof data === 'number' ? data : data?.name.toLowerCase()
                            },
                            sorting.direction,
                          ),
                        (x) => x.filter((item) => !showWins || item.wins > 0),
                        (x) =>
                          x.map((item, index) => {
                            return (
                              <tr
                                key={index}
                                className="hover:bg-amber-100 dark:hover:bg-amber-700"
                              >
                                {columns[0][3] && <td>{item.race?.name}</td>}
                                {columns[1][3] && <td>{item.class?.name}</td>}
                                {columns[2][3] && (
                                  <td>{item.god ? `${item.god.name}` : 'Atheist'}</td>
                                )}
                                <td className="text-right tabular-nums">{item.total}</td>
                                <td className="text-right tabular-nums">{item.wins}</td>
                                <td className="text-right tabular-nums">
                                  {formatNumber(item.winrate, {
                                    maximumFractionDigits: 2,
                                    minimumFractionDigits: 2,
                                  })}{' '}
                                  %
                                </td>
                              </tr>
                            )
                          }),
                      )()}
                    </tbody>
                  </table>
                ) : (
                  <GameList
                    filter={[
                      ...map(omit(filterForSearch, 'advanced'), (value, key) => ({
                        id: capitalize(key),
                        option: capitalize(key),
                        condition: 'is',
                        value,
                        operator: 'and',
                        suboption: undefined,
                      })),
                      {
                        id: 'End',
                        option: 'End',
                        condition: 'is',
                        value: showWins ? 'Escaped' : FilterValue.Any,
                        operator: 'and',
                        suboption: undefined,
                      },
                      ...filterForSearch.advanced,
                    ].filter((x) => x.value !== FilterValue.Any)}
                  />
                )}
              </section>
            </>
          )}
        </>
      )}
    </div>
  )
}

const GameList = (props: { filter: null | Filter[] }) => {
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

type Props = Response

type Response = StaticData

export const getStaticProps: GetStaticProps<Props> = async () => {
  const { data } = await createServerApi().api.get<Response>('/combos')

  return {
    revalidate: 300,
    props: {
      races: orderBy(data.races, (x) => x.name),
      classes: orderBy(data.classes, (x) => x.name),
      gods: orderBy(data.gods, (x) => x.name.toLowerCase()),
      versions: data.versions,
      skills: data.skills,
    },
  }
}

export default SuggestPage
