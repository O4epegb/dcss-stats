'use client'

import { ClipboardDocumentCheckIcon, ClipboardDocumentIcon } from '@heroicons/react/24/outline'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip as ChartJSTooltip,
  Legend,
  ChartOptions,
  ChartData,
  Colors,
  Plugin,
} from 'chart.js'
import { omit, isError, some, last, sampleSize } from 'lodash-es'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { Bar } from 'react-chartjs-2'
import useSWRImmutable from 'swr/immutable'
import { api } from '~/api'
import { Filter, Filters } from '~/components/Filters'
import { operators } from '~/components/Filters/constants'
import { Logo } from '~/components/Logo'
import { ThemeSelector } from '~/components/ThemeSelector'
import { Loader } from '~/components/ui/Loader'
import { Select } from '~/components/ui/Select'
import { HelpBubble, Tooltip } from '~/components/ui/Tooltip'
import { StaticData } from '~/types'
import { cn, getShortId } from '~/utils'

const CustomCanvasBackgroundColor: Plugin<
  'bar',
  {
    color?: string
  }
> = {
  id: 'customCanvasBackgroundColor',
  beforeDraw: (chart, args, options) => {
    const { ctx } = chart
    if (options.color) {
      ctx.save()
      ctx.globalCompositeOperation = 'destination-over'
      ctx.fillStyle = options.color
      ctx.fillRect(0, 0, chart.width, chart.height)
      ctx.restore()
    }
  },
}

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  ChartJSTooltip,
  Legend,
  Colors,
  CustomCanvasBackgroundColor,
)

type Dataset = {
  [key: string]: any
}

let copyTimeoutId: NodeJS.Timeout

export const ChartsScreen = ({
  staticData,
  defaultDatasets,
}: {
  staticData: StaticData
  defaultDatasets: {
    id: string
    filters: Filter[]
  }[]
}) => {
  const { resolvedTheme } = useTheme()

  const [showValidations, setShowValidations] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const [isCopied, setIsCopied] = useState(false)

  useEffect(() => {
    setIsMounted(() => true)
  }, [])

  const { filterOptions, races, versions } = staticData

  const [mainParams, setMainParams] = useState(() => ({
    groupBy: '',
    aggregationType: 'avg',
    aggregationField: '',
    version: versions[0],
  }))
  const [datasets, setDatasets] = useState<
    Array<{
      id: string
      filters: Filter[]
    }>
  >(() => defaultDatasets)
  const [paramsForSWR, setParamsForSWR] = useState<{
    datasets: typeof datasets
    mainParams: typeof mainParams
  } | null>(null)

  const isSwrDisabled = !paramsForSWR || some(paramsForSWR.mainParams, (x) => !x)

  const { data, error, isLoading } = useSWRImmutable(
    () => {
      if (isSwrDisabled) {
        return null
      }

      return [
        '/charts',
        {
          datasets: (paramsForSWR?.datasets ?? [])
            .map((set) => ({
              ...set,
              filters: set.filters.filter((x) => x.condition && x.value?.trim()),
            }))
            .filter((x) => x.filters.length > 0)
            .map((x) => ({
              filters: x.filters.map((x) => omit(x, 'id')),
            })),
          ...paramsForSWR.mainParams,
        },
      ]
    },
    ([url, { ...params }]) =>
      api
        .get<{
          data: Array<Dataset[]>
        }>(url, {
          params,
        })
        .then((res) => res.data)
        .then((data) => ({
          data: data.data.map((items, index) => ({
            items,
            label:
              params.datasets[index]?.filters
                .map((filter) => {
                  if (['Race', 'Class', 'God', 'End'].includes(filter.option)) {
                    return [
                      filter.condition === 'is'
                        ? ''
                        : filter.condition === 'is not'
                          ? '!'
                          : filter.condition + ' ',
                      filter.value,
                    ]
                      .filter(Boolean)
                      .join('')
                  }

                  return [filter.option, filter.condition, filter.suboption, filter.value]
                    .filter(Boolean)
                    .join(' ')
                })
                .join(', ') ?? 'No filters',
          })),
          ...params,
        })),
    {
      keepPreviousData: true,
    },
  )

  const isEmpty = data && (data.data.length === 0 || data.data.every((x) => x.items.length === 0))
  const lotsOfData = Boolean(data && data.data.some((x) => x.items.length > 50))

  const chartTextColor = resolvedTheme === 'dark' ? 'white' : 'black'
  const chartGridColor =
    resolvedTheme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
  const canvasBackgroundColor = resolvedTheme === 'dark' ? '#121212' : '#ffffff'
  const chartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: true,
    scales: {
      x: {
        grid: {
          display: true,
          color: chartGridColor,
        },
        ticks: {
          display: true,
          autoSkip: lotsOfData,
          font: lotsOfData
            ? {
                size: 10,
              }
            : undefined,
          color: chartTextColor,
          maxRotation: 90,
        },
      },
      y: {
        grid: {
          color: chartGridColor,
        },
        ticks: {
          color: chartTextColor,
        },
      },
    },
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
        labels: {
          color: chartTextColor,
        },
      },
      title: {
        display: true,
        text: `${data?.aggregationType}(${data?.aggregationField}) by ${data?.groupBy}`,
        color: chartTextColor,
      },
      ...{
        customCanvasBackgroundColor: {
          color: canvasBackgroundColor,
        },
      },
    },
    color: chartTextColor,
  }

  const chartData: ChartData<
    'bar',
    {
      x: string
      y: number
    }[]
  > = {
    datasets: data
      ? data.data.map((set) => ({
          label: set.label,
          data: set.items.map((item) => ({
            x: String(item[data.groupBy]) as string,
            y: item[`_${data.aggregationType}`][data.aggregationField] as number,
          })),
        }))
      : [],
  }

  return (
    <div className="container mx-auto flex flex-col space-y-4 p-4">
      <header className="m-auto flex w-full items-center gap-4">
        <Logo />
        <div className="ml-auto">
          <ThemeSelector />
        </div>
      </header>
      <div>
        <div
          className="relative m-auto w-full transition-all"
          style={{
            aspectRatio: data || isLoading ? '2/1' : '4/1',
          }}
        >
          {isLoading ? (
            <div className="flex h-full animate-pulse flex-col items-center justify-center gap-4">
              <Loader />
              Crunching the numbers...
            </div>
          ) : !data || isEmpty ? (
            <div className="flex h-full flex-col items-center justify-center gap-4">
              {isEmpty ? (
                <>
                  No data to show ¯\_(ツ)_/¯
                  <br />
                  <div>Try adjusting some filters</div>
                  <div>or</div>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-center gap-1">
                    Start by adding some datasets and filters
                    <HelpBubble
                      content={
                        <>
                          Main parameters will determine how data is grouped and aggregated
                          <br />
                          Each dataset will be a separate bar in the chart
                          <br />
                          Add dataset filters to narrow down the data
                        </>
                      }
                    />
                  </div>
                  <div>or</div>
                </>
              )}
              <button
                className="rounded border border-current bg-gray-800 px-2 py-2 text-white transition-colors hover:bg-gray-700 sm:px-4"
                onClick={() => {
                  const raceFilter = filterOptions.find((x) => x.name === 'Race')
                  const endFilter = filterOptions.find((x) => x.name === 'End')

                  if (!raceFilter || !endFilter) {
                    return
                  }

                  const sampleDatasets: typeof datasets = sampleSize(
                    races.filter((r) => r.trunk && !r.isSubRace).map((r) => r.name),
                    3,
                  ).map((value) => ({
                    id: getShortId(),
                    filters: [
                      {
                        id: getShortId(),
                        condition: raceFilter.conditions[0],
                        operator: operators[0],
                        option: raceFilter.name,
                        value,
                        suboption: raceFilter.suboptions[0],
                      },
                      {
                        id: getShortId(),
                        condition: endFilter.conditions[0],
                        operator: operators[0],
                        option: endFilter.name,
                        value: endFilter.values[0],
                        suboption: endFilter.suboptions[0],
                      },
                    ],
                  }))

                  setDatasets(sampleDatasets)

                  const sampleMainParams: typeof mainParams = {
                    groupBy: 'classAbbr',
                    aggregationType: 'avg',
                    aggregationField: 'turns',
                    version: process.env.NODE_ENV === 'production' ? versions[0] : versions[2],
                  }
                  setMainParams(sampleMainParams)

                  setParamsForSWR({
                    datasets: sampleDatasets,
                    mainParams: sampleMainParams,
                  })
                }}
              >
                Try sample data
              </button>
            </div>
          ) : (
            <Bar key={resolvedTheme} options={chartOptions} data={chartData} />
          )}
        </div>

        {isError(error) && (
          <div className="flex flex-col items-center justify-center gap-2 pb-4 pt-8">
            <div>Error occured, try to reload the page</div>
            {error.message && (
              <code className="bg-gray-100 p-2 dark:bg-zinc-700">{error.message}</code>
            )}
          </div>
        )}
      </div>
      <div className="m-auto w-full max-w-2xl space-y-4">
        <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
          <label className="space-y-1">
            <div className={cn('w-max', showValidations && !mainParams.groupBy && 'text-red-500')}>
              Group by
            </div>
            <Select
              className="w-full"
              value={mainParams.groupBy}
              onChange={(e) => setMainParams((x) => ({ ...x, groupBy: e.target.value }))}
            >
              <option disabled value="">
                Select field
              </option>
              <option value="raceAbbr">Race</option>
              <option value="classAbbr">Class</option>
              <option value="char">Race + Class</option>
              <option value="god">God</option>
              <option value="isWin">Is win</option>
              <option value="versionShort">Version</option>
              <option value="xl">XL</option>
              <option value="uniqueRunes">Runes</option>
              <option value="gems">Gems</option>
              <option value="branch">Branch</option>
              <option value="str">Str</option>
              <option value="int">Int</option>
              <option value="dex">Dex</option>
              <option value="ac">AC</option>
              <option value="ev">EV</option>
              <option value="sh">SH</option>
            </Select>
          </label>
          <label className="space-y-1">
            <div
              className={cn(
                'w-max',
                showValidations && !mainParams.aggregationType && 'text-red-500',
              )}
            >
              Aggregation type
            </div>
            <Select
              className="w-full"
              value={mainParams.aggregationType}
              onChange={(e) => setMainParams((x) => ({ ...x, aggregationType: e.target.value }))}
            >
              <option value="avg">Average</option>
              <option value="count">Count</option>
              <option value="max">Max</option>
              <option value="min">Min</option>
              <option value="sum">Sum</option>
            </Select>
          </label>
          <label className="space-y-1">
            <div
              className={cn(
                'w-max',
                showValidations && !mainParams.aggregationField && 'text-red-500',
              )}
            >
              Aggregation field
            </div>
            <Select
              // disabled={mainParams.aggregationType === 'count'}
              className="w-full"
              value={mainParams.aggregationField}
              onChange={(e) => setMainParams((x) => ({ ...x, aggregationField: e.target.value }))}
            >
              <option disabled value="">
                Select field
              </option>
              <option value="score">Score</option>
              <option value="turns">Turns</option>
              <option value="xl">XL</option>
              <option value="duration">Duration</option>
              <option value="runes">Runes</option>
              <option value="gems">Gems</option>
              <option value="str">Str</option>
              <option value="dex">Dex</option>
              <option value="int">Int</option>
              <option value="ac">AC</option>
              <option value="ev">EV</option>
              <option value="sh">SH</option>
              <option value="scrollsused">Scrolls used</option>
              <option value="potionsused">Potions used</option>
              <option value="gold">Gold</option>
              <option value="goldfound">Gold found</option>
              <option value="goldspent">Gold spent</option>
            </Select>
          </label>
          <label className="space-y-1">
            <div className="flex w-max items-center gap-1">
              Version
              {mainParams.groupBy !== 'versionShort' && (
                <HelpBubble
                  content={
                    <>
                      All datasets will be queried with the selected version
                      <br />
                      Per dataset version filter is disabled for now
                    </>
                  }
                />
              )}
            </div>
            <Select
              disabled={mainParams.groupBy === 'versionShort'}
              className="w-full"
              value={mainParams.version}
              onChange={(e) => setMainParams((x) => ({ ...x, version: e.target.value }))}
            >
              {versions.map((version) => (
                <option key={version} value={version}>
                  {mainParams.groupBy === 'versionShort' ? 'Disabled' : version}
                </option>
              ))}
            </Select>
          </label>
        </div>
        <div className="space-y-4">
          {isMounted &&
            datasets.map((dataset, index) => {
              return (
                <div
                  key={dataset.id}
                  id={dataset.id}
                  className="rounded border border-gray-700 bg-zinc-50 p-4 pl-8 dark:border-zinc-700 dark:bg-gray-800"
                >
                  <Filters
                    title={`Dataset ${index + 1}`}
                    replaceQuery={false}
                    filterOptions={filterOptions}
                    excludeFilters={['Version']}
                    getDefaultFilters={(filters) => filters.filter((x) => x.option === 'Race')}
                    filters={dataset.filters}
                    setFilters={(filters) => {
                      if (typeof filters === 'function') {
                        setDatasets((state) =>
                          state.map((x) =>
                            x.id === dataset.id ? { ...x, filters: filters(x.filters) } : x,
                          ),
                        )
                      } else {
                        setDatasets((state) =>
                          state.map((x) => (x.id === dataset.id ? { ...x, filters } : x)),
                        )
                      }
                    }}
                    onDelete={() =>
                      setDatasets((state) => state.filter((x) => x.id !== dataset.id))
                    }
                  />
                </div>
              )
            })}
        </div>
        <div className="sticky bottom-4 flex items-center justify-between gap-2 rounded border border-zinc-700 bg-[Canvas] p-2 sm:p-4">
          <Tooltip disabled={datasets.length < 5} content="Maximum 5 datasets">
            <button
              className="rounded border px-4 py-2 text-xs transition-colors hover:bg-gray-100 dark:hover:bg-zinc-800 sm:text-base"
              disabled={datasets.length === 5}
              onClick={() => {
                const newDataset = {
                  id: getShortId(),
                  filters: last(datasets)?.filters ?? [],
                }
                setDatasets((prev) => [...prev, newDataset])

                setTimeout(() => {
                  const lastDataset = document.querySelector('#' + newDataset.id)
                  lastDataset?.scrollIntoView({
                    behavior: 'smooth',
                  })
                }, 50)
              }}
            >
              + Add dataset
            </button>
          </Tooltip>
          {!isLoading && data && (
            <button
              className="flex items-center justify-center gap-1 rounded border px-2 py-2 text-xs transition-colors hover:bg-gray-100 dark:hover:bg-zinc-800 sm:px-4 sm:text-base"
              onClick={() => {
                const canvas = document.querySelector('canvas')
                if (!canvas) {
                  return
                }
                canvas.toBlob(async (blob) => {
                  if (!blob) {
                    alert('Failed to copy image: Could not create image data.')
                    throw new Error('Failed to create blob from canvas')
                  }
                  try {
                    await navigator.clipboard.write([
                      new ClipboardItem({
                        [blob.type]: blob,
                      }),
                    ])

                    setIsCopied(true)

                    clearTimeout(copyTimeoutId)
                    copyTimeoutId = setTimeout(() => {
                      setIsCopied(false)
                    }, 3000)
                  } catch (error) {
                    alert('Failed to copy image')

                    throw error
                  }
                })
              }}
            >
              {isCopied ? (
                <ClipboardDocumentCheckIcon className="size-4 shrink-0 text-green-500 sm:size-6" />
              ) : (
                <ClipboardDocumentIcon className="size-4 shrink-0 sm:size-6" />
              )}
              Copy as Image
            </button>
          )}
          <button
            className="rounded border border-current bg-gray-800 px-2 py-2 text-xs text-white transition-colors hover:bg-gray-700 sm:px-4 sm:text-base"
            onClick={() => {
              setParamsForSWR({
                datasets,
                mainParams,
              })

              setShowValidations(true)
            }}
          >
            This is how I like it!
          </button>
        </div>
      </div>
    </div>
  )
}
