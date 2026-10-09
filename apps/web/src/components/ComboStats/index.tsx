import { useLocalStorageValue, useMediaQuery } from '@react-hookz/web'
import dynamic from 'next/dynamic'
import { PropsWithChildren, useEffect, useId, useMemo, useRef, useState } from 'react'
import { ComboHighlight, ScatterMetric } from '~/components/ComboScatterPlot/data'
import { FilterItemType, Filters } from '~/components/Filters'
import { Matrix } from '~/components/Matrix'
import { Select } from '~/components/ui/Select'
import { Tooltip } from '~/components/ui/Tooltip'
import { Summary } from '~/screens/Player/utils'
import { CharStat } from '~/types'
import { cn, notEmpty } from '~/utils'
import { filterComboStats, getComboFilterOptions } from './filters'

const ComboScatterPlot = dynamic(() => import('~/components/ComboScatterPlot'), {
  ssr: false,
  loading: () => (
    <div className="text-muted-foreground py-12 text-center">Loading scatter plot…</div>
  ),
})

export const ComboStats = ({
  stats,
  allActualRaces,
  allActualClasses,
  greatRaces,
  greatClasses,
  showTrunkData,
  coloredHeatMap = false,
  toggleShowTrunkData,
  enableFilters = false,
  children,
}: PropsWithChildren<{
  stats: Summary['stats']
  allActualRaces: Summary['allActualRaces']
  allActualClasses: Summary['allActualClasses']
  greatRaces?: Summary['greatRaces']
  greatClasses?: Summary['greatClasses']
  showTrunkData?: boolean
  coloredHeatMap?: boolean
  toggleShowTrunkData?: () => void
  enableFilters?: boolean
}>) => {
  const isWide = useMediaQuery('(min-width: 1280px)', { initializeWithValue: false })
  const [isSticky, setIsSticky] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const [matrixMetric, setMatrixMetric] = useState<keyof CharStat>('wins')
  const [scatterMetric, setScatterMetric] = useState<ScatterMetric>('winRate')
  const [filters, setFilters] = useState<FilterItemType[]>([])
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [highlight, setHighlight] = useState<ComboHighlight>()
  const filtersId = useId()
  const { value: view, set: setView } = useLocalStorageValue<'matrix' | 'scatter'>(
    'dcss-combo-presentation',
    { defaultValue: 'matrix', initializeWithValue: false },
  )
  const currentView = view === 'scatter' ? 'scatter' : 'matrix'
  const showScatter = currentView === 'scatter'

  const filterOptions = useMemo(
    () => getComboFilterOptions(allActualRaces, allActualClasses),
    [allActualRaces, allActualClasses],
  )
  const displayed = useMemo(
    () =>
      filterComboStats(
        stats,
        showTrunkData ? allActualRaces.filter((x) => x.trunk) : allActualRaces,
        showTrunkData ? allActualClasses.filter((x) => x.trunk) : allActualClasses,
        enableFilters ? filters : [],
      ),
    [stats, allActualRaces, allActualClasses, showTrunkData, enableFilters, filters],
  )
  const isFiltered = displayed.filterCount > 0
  const hasHighlight = Boolean(highlight?.abbr)
  const highlightOptions = useMemo(
    () =>
      [...(highlight?.dimension === 'race' ? allActualRaces : allActualClasses)].sort((a, b) =>
        a.name.localeCompare(b.name),
      ),
    [highlight?.dimension, allActualRaces, allActualClasses],
  )

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const updateSticky = () =>
      setIsSticky(Boolean(isWide && window.innerHeight > element.offsetHeight))
    const observer = new ResizeObserver(updateSticky)
    observer.observe(element)
    window.addEventListener('resize', updateSticky)
    updateSticky()

    return () => {
      observer.disconnect()
      window.removeEventListener('resize', updateSticky)
    }
  }, [isWide])

  const someItemHasMaxXL = useMemo(
    () => Object.values(stats.combos).some((x) => x.maxXl != null),
    [stats.combos],
  )
  const someItemHasFirstWin = useMemo(
    () => Object.values(stats.combos).some((x) => x.gamesToFirstWin != null),
    [stats.combos],
  )

  const categories = (
    [
      ['wins', 'wins'],
      ['games', 'games'],
      ['win rate %', 'winRate'],
      someItemHasMaxXL ? (['best XL', 'maxXl'] as const) : null,
      someItemHasFirstWin ? (['first win', 'gamesToFirstWin'] as const) : null,
    ] as const
  ).filter(notEmpty)

  return (
    <div ref={ref} className={cn('relative w-full', isSticky && 'sticky top-0')}>
      {children}
      <div
        role="group"
        aria-label="Data presentation"
        className="flex flex-wrap gap-1 pt-6 text-sm"
      >
        {(['matrix', 'scatter'] as const).map((presentation) => (
          <button
            key={presentation}
            type="button"
            aria-pressed={presentation === currentView}
            className={cn(
              'rounded-sm px-3 py-1',
              presentation === currentView
                ? 'bg-primary text-primary-foreground'
                : 'bg-surface-emphasis',
            )}
            onClick={() => setView(presentation)}
          >
            {presentation === 'matrix' ? 'Matrix' : 'Scatter plot'}
          </button>
        ))}
        {enableFilters && (
          <button
            type="button"
            aria-expanded={filtersOpen}
            aria-controls={filtersId}
            className={cn(
              'ml-auto rounded-sm px-3 py-1',
              isFiltered || (showScatter && hasHighlight)
                ? 'bg-warning text-background'
                : 'bg-surface-emphasis',
            )}
            onClick={() => setFiltersOpen((open) => !open)}
          >
            Filters{isFiltered && ` (${displayed.filterCount})`}
          </button>
        )}
      </div>
      {enableFilters && (
        <div
          id={filtersId}
          hidden={!filtersOpen}
          className="border-border mt-3 rounded border py-3 pr-3 pl-8"
        >
          <Filters
            title="Combination filters"
            filterOptions={filterOptions}
            filters={filters}
            setFilters={setFilters}
            getDefaultFilters={() => []}
            replaceQuery={false}
          />
          {showScatter && (
            <div className="border-border mt-4 space-y-2 border-t pt-3">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <label htmlFor={`${filtersId}-highlight`} className="font-medium">
                  Highlight
                </label>
                <Select
                  id={`${filtersId}-highlight`}
                  aria-label="Highlight by"
                  className="h-7"
                  value={highlight?.dimension ?? ''}
                  onChange={(event) => {
                    const dimension = event.target.value
                    setHighlight(
                      dimension === 'race' || dimension === 'background'
                        ? { dimension, abbr: '' }
                        : undefined,
                    )
                  }}
                >
                  <option value="">None</option>
                  <option value="race">Race</option>
                  <option value="background">Background</option>
                </Select>
                {highlight && (
                  <>
                    <Select
                      aria-label={`Highlight ${highlight.dimension}`}
                      className="h-7 max-w-full min-w-0"
                      value={highlight.abbr}
                      onChange={(event) =>
                        setHighlight({
                          ...highlight,
                          abbr: event.target.value,
                          name: highlightOptions.find((item) => item.abbr === event.target.value)
                            ?.name,
                        })
                      }
                    >
                      <option value="">Choose a {highlight.dimension}</option>
                      {highlightOptions.map((item) => (
                        <option key={item.abbr} value={item.abbr}>
                          {item.name}
                        </option>
                      ))}
                    </Select>
                    <button
                      type="button"
                      aria-label="Clear highlight"
                      className="hover:bg-surface-hover h-7 rounded-sm border-none px-2 py-1"
                      onClick={() => setHighlight(undefined)}
                    >
                      Clear
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      )}
      <div className="flex flex-wrap items-center gap-2 py-4">
        <span className="font-medium">{showScatter ? 'Y axis' : 'Matrix by'}</span>
        {(showScatter
          ? ([
              ['win rate %', 'winRate'],
              ['wins', 'wins'],
            ] as const)
          : categories
        ).map(([name, key]) => (
          <button
            key={key}
            type="button"
            aria-pressed={(showScatter ? scatterMetric : matrixMetric) === key}
            className={cn(
              'rounded-sm px-2 py-0.5 font-light',
              (showScatter ? scatterMetric : matrixMetric) === key
                ? 'bg-warning text-background'
                : 'bg-surface-emphasis',
            )}
            onClick={() => {
              if (showScatter && (key === 'wins' || key === 'winRate')) setScatterMetric(key)
              else setMatrixMetric(key)
            }}
          >
            {name}
          </button>
        ))}
        {toggleShowTrunkData && (
          <Tooltip
            interactive
            content={
              <div className="flex flex-col gap-1">
                Combination display settings
                <hr />
                <label className="inline-flex items-center gap-1">
                  <input
                    checked={showTrunkData}
                    type="checkbox"
                    onChange={() => toggleShowTrunkData()}
                  />{' '}
                  Only show combos from trunk
                </label>
              </div>
            }
          >
            <button
              type="button"
              aria-label="Combination display settings"
              className="text-muted-foreground hover:text-accent ml-auto transition"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </Tooltip>
        )}
      </div>
      {isFiltered && (
        <p role="status" className="text-muted-foreground mb-3 text-sm">
          Showing {displayed.count} of {displayed.total} played combinations.
        </p>
      )}
      {isFiltered && displayed.count === 0 ? (
        <p className="text-muted-foreground py-12 text-center">
          No combinations match these filters.
        </p>
      ) : showScatter ? (
        <ComboScatterPlot
          stats={displayed.stats.combos}
          races={displayed.races}
          classes={displayed.classes}
          metric={scatterMetric}
          highlight={enableFilters && hasHighlight ? highlight : undefined}
        />
      ) : (
        <Matrix
          stats={displayed.stats}
          races={displayed.races}
          classes={displayed.classes}
          greatRaces={isFiltered ? undefined : greatRaces}
          greatClasses={isFiltered ? undefined : greatClasses}
          filtered={isFiltered}
          metric={matrixMetric}
          coloredHeatMap={coloredHeatMap}
        />
      )}
    </div>
  )
}
