'use client'

import { useLocalStorageValue } from '@react-hookz/web'
import clsx from 'clsx'
import {
  every,
  groupBy,
  map,
  omit,
  pickBy,
  filter as _filter,
  isEmpty,
  noop,
  capitalize,
  flow,
  orderBy,
  sample,
} from 'lodash-es'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Fragment, useEffect, useMemo, useState } from 'react'
import useSWRImmutable from 'swr/immutable'
import { api } from '~/api'
import { Filter, Filters, filtersToQuery } from '~/components/Filters'
import { Matrix } from '~/components/Matrix'
import { WinrateStats } from '~/components/WinrateStats'
import { Loader } from '~/components/ui/Loader'
import { Select } from '~/components/ui/Select'
import { HelpBubble, Tooltip } from '~/components/ui/Tooltip'
import { getStatsFromMatrix } from '~/screens/Player/utils'
import { MatrixRecordType, StaticData } from '~/types'
import { formatNumber, notEmpty, stringifyQuery } from '~/utils'
import { GameList } from './GameList'
import { Layout } from './Layout'
import { SkillProgression } from './SkillProgression'

enum FilterValue {
  Any = 'any',
}

type Stats = { wins: number; total: number }
type Combos = Record<string, Stats>
type SuggestResponse = Stats & { combos: Combos }

type MainFilter = {
  race: string
  class: string
  god: string
  version: string
}

export function SuggestScreen({ classes, gods, races, filterOptions, versions }: StaticData) {
  type SortingKey = keyof ReturnType<typeof normalizeData>[number]

  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const { value: showTableFilters, set: setShowTableFilters } = useLocalStorageValue(
    'showTableFilters',
    {
      defaultValue: true,
      initializeWithValue: false,
    },
  )
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
  const {
    value: groupingKey,
    set: setGroupingKey,
    remove: removeGroupingKey,
  } = useLocalStorageValue<undefined | null | keyof Omit<typeof filter, 'version'>>('groupingKey', {
    defaultValue: null,
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

  const loadingMessages = [
    'Teleporting to a random location...',
    'Reading a scroll of acquirement...',
    'Summoning butterflies...',
    'Tabbing through Lair...',
    'Quaffing !degeneration...',
  ]

  const [currentLoadingMessage, setCurrentLoadingMessage] = useState(loadingMessages[0])

  const changeFilter = (key: keyof typeof filter, value: string) => {
    setFilter((current) => ({ ...current, [key]: value }))
  }

  useEffect(() => {
    const [qRace, qClass, qGod, qVersion] = [
      searchParams.get('race'),
      searchParams.get('class'),
      searchParams.get('god'),
      searchParams.get('version'),
    ]

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
      if (pathname) {
        router.replace(pathname)
      }

      return
    }

    const newFilter = {
      race: race?.name || FilterValue.Any,
      class: klass?.name || FilterValue.Any,
      god: god?.name || FilterValue.Any,
      version: version || versions[0],
    } as const

    setFilter(newFilter)

    setFilterForSearch((x) => ({
      ...x,
      version: newFilter.version,
    }))

    if (!every(omit(newFilter, 'version'), (value) => value === FilterValue.Any)) {
      setFilterForSearch((x) => ({ ...x, ...newFilter }))
    }
  }, [])

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

  const [tableFilters, setTableFilters] = useState(
    () => new Map(columns.map(([, key]) => [key, ''])),
  )

  const mainParams = pickBy(
    {
      race: race?.name,
      class: klass?.name,
      god: god?.name,
    },
    (value) => value,
  )
  const apiParams = {
    ...mainParams,
    version: filterForSearch.version,
    filter: filterForSearch.advanced.map((x) => omit(x, 'id')),
  }
  const isSwrDisabled = isEmpty(mainParams) || !advancedFilter

  const { data, error, isValidating } = useSWRImmutable(
    () => {
      if (isSwrDisabled) {
        return null
      }

      return ['/suggest', apiParams]
    },
    ([url, params]) => api.get<SuggestResponse>(url, { params }).then((res) => res.data),
  )

  const {
    data: matrixData,
    error: matrixError,
    isLoading: matrixIsLoading,
    isValidating: matrixIsValidating,
  } = useSWRImmutable(
    () => {
      if (!advancedFilter) {
        return null
      }

      const godFilter: Filter | null =
        filterForSearch.god !== FilterValue.Any
          ? {
              id: '',
              condition: 'is',
              operator: 'and',
              value: filterForSearch.god,
              option: 'God',
              suboption: undefined,
            }
          : null

      return [
        '/matrix',
        {
          version: filterForSearch.version,
          filter: [godFilter, ...filterForSearch.advanced]
            .filter(notEmpty)
            .map((x) => omit(x, 'id')),
        },
      ]
    },
    ([url, params]) => {
      const newMessage = sample(loadingMessages)

      if (newMessage) {
        setCurrentLoadingMessage(newMessage)
      }

      return api
        .get<{
          matrix: Record<string, [number, number]>
        }>(url, { params })
        .then((res) => res.data)
    },
  )

  const normalizeData = ({ combos }: SuggestResponse) => {
    let data = map(combos, (value, key) => {
      const [raceAbbr, classAbbr, godName] = key.split(',')

      return {
        ...value,
        race: races.find((x) => x.abbr === raceAbbr),
        class: classes.find((x) => x.abbr === classAbbr),
        god: godName
          ? gods.find((x) => x.name === godName)
          : {
              name: 'Atheist',
              abbr: 'AT',
            },
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

  const renderOptionList = (options: Array<{ name: string; trunk: boolean }>) => {
    return options.map(({ name, trunk }, index, array) => {
      const prev = array[index - 1]

      return (
        <Fragment key={name}>
          {prev && prev.trunk && !trunk && <hr />}
          <option value={name}>{name}</option>
        </Fragment>
      )
    })
  }

  const dataToShow = flow(
    () => (data ? normalizeData(data) : []),
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
    (x) => {
      if (!showTableFilters) {
        return x
      }

      const activeTableFilters = Array.from(tableFilters.entries()).filter(
        ([key, value]) =>
          value.trim() && columns.find(([, colKey]) => colKey === key)?.[3] !== false,
      )

      return x.filter((item) =>
        activeTableFilters.every(([key, value]) => {
          const itemValue = item[key]

          if (itemValue === undefined) {
            return false
          }

          if (typeof itemValue === 'number') {
            if (value.startsWith('>=')) {
              return itemValue >= Number(value.slice(2))
            } else if (value.startsWith('<=')) {
              return itemValue <= Number(value.slice(2))
            } else if (value.startsWith('>')) {
              return itemValue > Number(value.slice(1))
            } else if (value.startsWith('<')) {
              return itemValue < Number(value.slice(1))
            } else if (value.startsWith('=')) {
              return itemValue === Number(value.slice(1))
            }

            return itemValue === Number(value)
          }

          return itemValue.name.toLowerCase().includes(value.toLowerCase())
        }),
      )
    },
  )()

  const statsData = useMemo(() => {
    const matrix = Object.entries(matrixData?.matrix ?? {}).reduce((acc, [key, [games, wins]]) => {
      const [char] = key.split(',')

      acc[char] =
        acc[char] ??
        ({
          games: 0,
          wins: 0,
          winRate: 0,
          maxXl: undefined,
          gamesToFirstWin: undefined,
        } as MatrixRecordType[string])

      acc[char].games += games
      acc[char].wins += wins
      acc[char].winRate = acc[char].wins / acc[char].games

      return acc
    }, {} as MatrixRecordType)

    return getStatsFromMatrix({
      matrix,
      allClasses: classes,
      allRaces: races,
    })
  }, [matrixData?.matrix])

  const matrixComponent = matrixError ? (
    <div className="flex items-center justify-center p-8 text-red-600">
      Error fetching matrix data
    </div>
  ) : (
    <Matrix
      coloredHeatMap
      stats={statsData.stats}
      allActualClasses={statsData.allActualClasses}
      allActualRaces={statsData.allActualRaces}
    >
      {(!advancedFilter || matrixIsValidating || matrixIsLoading) && (
        <div className="absolute inset-0 z-1 flex animate-pulse flex-col items-center justify-center gap-4 bg-white/80 pt-20 dark:bg-zinc-800/80">
          {currentLoadingMessage}
          <Loader />
        </div>
      )}
    </Matrix>
  )

  return (
    <Layout rightColumn={matrixComponent}>
      <div className="flex w-full flex-wrap gap-2 md:justify-center">
        I want to play
        <Select value={filter.race} onChange={(e) => changeFilter('race', e.target.value)}>
          <option value={FilterValue.Any}>any race</option>
          {renderOptionList(races)}
        </Select>
        <Select value={filter.class} onChange={(e) => changeFilter('class', e.target.value)}>
          <option value={FilterValue.Any}>some class</option>
          {renderOptionList(classes)}
        </Select>
        and
        <Select value={filter.god} onChange={(e) => changeFilter('god', e.target.value)}>
          <option value={FilterValue.Any}>whatever god</option>
          {renderOptionList(gods)}
        </Select>
      </div>

      <div className="flex w-full max-w-lg items-center gap-2">
        <button
          className="-ml-2 flex items-center gap-1 rounded-sm px-2 py-1 text-sm hover:bg-gray-100 dark:hover:bg-zinc-700"
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

      <div className={clsx('w-full max-w-lg space-y-4', !showAdvancedFilters && 'hidden')}>
        <hr />
        <Filters
          filterOptions={filterOptions}
          excludeFilters={['Class', 'Race', 'God', 'End', 'Player', 'Version']}
          onInit={(filters) => {
            setAdvancedFilter(filters)
            setFilterForSearch((x) => ({ ...x, advanced: filters }))
          }}
          onFiltersChange={setAdvancedFilter}
        />
      </div>

      <div className="flex w-full max-w-lg items-center justify-center gap-2">
        <Tooltip disabled={buttonEnabled} content="Select at least one option from Race/Class/God">
          <button
            type="button"
            className={clsx(
              'flex items-center gap-x-2 rounded-sm border bg-gray-800 px-4 py-2 text-white transition-colors',
              buttonEnabled && 'hover:bg-gray-700',
            )}
            onClick={() => {
              if (!buttonEnabled) {
                return
              }

              setFilterForSearch({ ...filter, advanced: advancedFilter ?? [] })

              const query = pickBy(
                {
                  race: filter.race,
                  class: filter.class,
                  god: filter.god,
                  version: filter.version,
                  filter: advancedFilter ? filtersToQuery(advancedFilter) : FilterValue.Any,
                },
                (value) => value !== FilterValue.Any,
              )

              window.history.replaceState(null, '', `?${stringifyQuery(query)}`)
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
            <h2 className="pt-2 text-center text-2xl">
              {race?.name} {klass?.name}{' '}
              {god && (
                <>
                  <span className="font-light">of</span> {god.name}
                </>
              )}
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
          {data.total > 0 && (
            <>
              <section className="m-auto flex w-full max-w-lg flex-wrap items-center justify-between gap-2">
                <SkillProgression
                  isLastVersion={filter.version === versions[0]}
                  apiParams={apiParams}
                  isSwrDisabled={isSwrDisabled}
                />
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
                            className={clsx('flex cursor-pointer items-center gap-1 select-none')}
                          >
                            <input
                              type="radio"
                              className="cursor-pointer"
                              checked={groupingKey === key}
                              onChange={noop}
                              onClick={() => {
                                if (groupingKey === key) {
                                  removeGroupingKey()
                                } else {
                                  setGroupingKey(key)
                                }
                              }}
                            />
                            Group by {key}
                          </label>
                        ),
                    )}
                  </div>
                )}
                <div className="flex w-full gap-2">
                  <label className="flex w-max cursor-pointer items-center gap-1 select-none">
                    <input
                      checked={showTableFilters}
                      className="cursor-pointer"
                      type="checkbox"
                      onChange={(e) => setShowTableFilters(e.target.checked)}
                    />
                    Show table filters
                    <HelpBubble
                      content={
                        <div>
                          <p>
                            Filter the table by entering a value in the input fields under each
                            column.
                          </p>
                          <p>
                            Filter numeric values by using the following operators:{' '}
                            <code>&gt;</code>, <code>&gt;=</code>, <code>&lt;</code>,{' '}
                            <code>&lt;=</code>, <code>=</code>.
                          </p>
                          <p>
                            Filter text values by entering a part of the text you want to filter by.
                          </p>
                        </div>
                      }
                    />
                  </label>
                </div>
                <label className="flex cursor-pointer items-center gap-1 select-none">
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
                      className="flex rounded-md focus:outline-hidden focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-100"
                      onClick={() => setView(item)}
                    >
                      <span
                        className={clsx(
                          'rounded-md p-1.5 text-sm font-medium lg:pr-2.5 lg:pl-2.5',
                          view === item &&
                            'ring-opacity-5 bg-white shadow-xs ring-1 ring-black dark:bg-zinc-500',
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
                  <>
                    <table className="w-full table-auto">
                      <thead>
                        <tr>
                          {columns.map(([title, sortingKey, type, isVisible = true]) => {
                            if (!isVisible) {
                              return null
                            }

                            const sortingButton = sorting.key === sortingKey && (
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
                            )

                            return (
                              isVisible && (
                                <th
                                  key={title}
                                  className={clsx(type === 'numeric' ? 'text-right' : 'text-left')}
                                >
                                  <div
                                    className="inline-flex cursor-pointer items-center whitespace-nowrap select-none"
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
                                    {sortingButton}
                                  </div>
                                </th>
                              )
                            )
                          })}
                        </tr>
                        {showTableFilters && (
                          <tr>
                            {columns.map(([title, sortingKey, type, isVisible = true]) => {
                              if (!isVisible) {
                                return null
                              }

                              return (
                                <th
                                  key={title}
                                  className={clsx(
                                    'p-[1px]',
                                    type === 'numeric' ? 'text-right' : 'text-left',
                                  )}
                                >
                                  <input
                                    type="text"
                                    className="w-full rounded-sm border px-1 font-normal"
                                    value={tableFilters.get(sortingKey)}
                                    onChange={(e) => {
                                      setTableFilters((prev) => {
                                        prev.set(sortingKey, e.target.value)

                                        return new Map(prev)
                                      })
                                    }}
                                  />
                                </th>
                              )
                            })}
                          </tr>
                        )}
                      </thead>
                      <tbody>
                        {dataToShow.map((item, index) => {
                          return (
                            <tr
                              key={index}
                              className="odd:bg-gray-50 even:bg-white hover:bg-amber-100 odd:dark:bg-zinc-800 even:dark:bg-zinc-900 dark:hover:bg-amber-700"
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
                        })}
                      </tbody>
                    </table>
                    {dataToShow.length === 0 && (
                      <div className="flex min-h-[300px] items-center justify-center">
                        No matching data found
                      </div>
                    )}
                  </>
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
    </Layout>
  )
}
