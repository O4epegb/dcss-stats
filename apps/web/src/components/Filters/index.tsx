import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { restrictToVerticalAxis } from '@dnd-kit/modifiers'
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable'
import { useUpdateEffect } from '@react-hookz/web'
import clsx from 'clsx'
import { last, first } from 'lodash-es'
import { useSearchParams } from 'next/navigation'
import qs from 'qs'
import { useState, useEffect, Dispatch, SetStateAction, useMemo } from 'react'
import { Select } from '~/components/ui/Select'
import { HelpBubble, Tooltip } from '~/components/ui/Tooltip'
import { StaticData } from '~/types'
import { notEmpty, stringifyQuery } from '~/utils'
import { SortableItem } from './SortableItem'
import { operators } from './constants'

// Order by selector
// Hotkey for submit
// killer, gold, potions, scrolls, server, duration, date period filter?
// send maximum filters from the backend

export type Filter = {
  id: string
  option: string
  suboption: string | undefined
  condition: string
  value: string | undefined
  operator: string
}

const maxFilters = 15

type Data = Pick<StaticData, 'filterOptions'>

export const filtersToQuery = (filters: Filter[]) => {
  return filters.map(({ option, suboption, condition, value, operator }, index) => {
    return [option, suboption, condition, value, index === filters.length - 1 ? null : operator]
      .filter(notEmpty)
      .join('_')
  })
}

type Props = {
  title?: string
  filters?: Filter[]
  setFilters?: Dispatch<SetStateAction<Filter[]>>
  excludeFilters?: string[]
  replaceQuery?: boolean
  onInit?: (filters: Filter[]) => void
  onFiltersChange?: (filters: Filter[]) => void
  onSubmit?: (filters: Filter[]) => void
  getDefaultFilters?: (filters: Filter[]) => Filter[]
  onDelete?: () => void
} & Data

export const Filters = ({
  title,
  filterOptions,
  excludeFilters = [],
  replaceQuery = true,
  getDefaultFilters: propsGetDefaultFilters = (filters) => filters,
  onInit,
  onSubmit,
  onFiltersChange,
  onDelete,
  filters: propsFilters,
  setFilters: propsSetFilters,
}: Props) => {
  const searchParams = useSearchParams()
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )
  const [isDragging, setIsDragging] = useState(false)

  const options = useMemo(
    () =>
      filterOptions.filter(
        (x) => !excludeFilters.includes(x.name) && (x.type !== 'select' || x.values.length > 0),
      ),
    [filterOptions, String(excludeFilters)],
  )

  const [_filters, _setFilters] = useState<Filter[]>(() => [])
  const filters = propsFilters ?? _filters
  const setFilters = propsSetFilters ?? _setFilters

  const getAllPossibleFilters = () =>
    options.map(({ name, conditions, suboptions }) => {
      return {
        id: Math.random().toString(),
        option: name,
        suboption: suboptions[0],
        condition: conditions[0],
        operator: operators[0],
        value: '',
      }
    })

  const getDefaultFilters = () => propsGetDefaultFilters(getAllPossibleFilters())

  useEffect(() => {
    if (propsFilters) {
      return
    }

    let potentialFilters: Filter[] = []

    if (replaceQuery) {
      const queryFilters = searchParams.getAll('filter').filter(notEmpty)

      potentialFilters = queryFilters
        .map((item) => {
          const parts = item.split('_')
          let [option, condition, value, operator, suboption] = parts

          if (['Skill', 'Stat'].includes(parts[0])) {
            ;[option, suboption, condition, value, operator] = parts
          }

          const optionItem = options.find((x) => x.name === option)

          const isValid =
            optionItem &&
            (optionItem.type !== 'select' || optionItem.values.find((x) => x === value)) &&
            optionItem.conditions.includes(condition) &&
            (!operator || operators.includes(operator)) &&
            (!suboption || optionItem.suboptions.some((x) => x === suboption))

          if (!isValid) {
            return
          }

          return {
            id: Math.random().toString(),
            option,
            suboption,
            condition,
            value,
            operator: operator ?? operators[0],
          }
        })
        .filter(notEmpty)

      if (potentialFilters.length > 1) {
        const lastOne = potentialFilters[potentialFilters.length - 1]
        lastOne.operator = potentialFilters[potentialFilters.length - 2].operator
      }

      if (potentialFilters.length !== queryFilters.length) {
        potentialFilters = getDefaultFilters()

        const params = new URLSearchParams(searchParams.toString())

        params.delete('filter')

        window.history.replaceState(null, '', `?${params.toString()}`)
      } else if (queryFilters.length === 0) {
        potentialFilters = getDefaultFilters()
      }
    } else {
      potentialFilters = getDefaultFilters()
    }

    const nonEmptyFilters = potentialFilters.filter((x) => x.value && x.condition)

    onInit?.(nonEmptyFilters)
    setFilters(potentialFilters)
  }, [])

  useUpdateEffect(() => {
    const nonEmptyFilters = filters.filter((x) => x.value && x.condition)
    onFiltersChange?.(nonEmptyFilters)
  }, [filters])

  const filterGroups = filters
    .reduce(
      (acc, item, index) => {
        const prev = filters[index - 1]
        const next = filters[index + 1]
        last(acc)?.push(item)

        if (
          next &&
          item.operator === 'and' &&
          (prev?.operator === 'or' || next?.operator === 'or')
        ) {
          acc.push([])
        }

        return acc
      },
      [[]] as Array<Filter[]>,
    )
    .filter((x) => x.length > 0)

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1">
        <div className="text-xl">{title ?? 'Filters'}</div>
        <HelpBubble
          content={
            <>
              Filters are grouped by{' '}
              <code className="rounded bg-slate-600 px-1 dark:bg-slate-300">OR</code> operator
              <br />
              Groups are color coded for convenience
            </>
          }
        />
        <button
          className="-mr-2 ml-auto rounded px-2 py-1 hover:bg-gray-100 dark:hover:bg-zinc-800"
          onClick={() => setFilters(getDefaultFilters())}
        >
          Reset
        </button>
      </div>
      <div className="space-y-3">
        <DndContext
          sensors={sensors}
          modifiers={[restrictToVerticalAxis]}
          collisionDetection={closestCenter}
          onDragStart={() => setIsDragging(true)}
          onDragEnd={(event) => {
            const { active, over } = event

            setIsDragging(false)

            if (over && active.id !== over.id) {
              setFilters((items) => {
                const oldIndex = items.findIndex((x) => x.id === active.id)
                const newIndex = items.findIndex((x) => x.id === over.id)

                return arrayMove(items, oldIndex, newIndex)
              })
            }
          }}
        >
          <SortableContext items={filters} strategy={verticalListSortingStrategy}>
            {filterGroups.length > 0 && (
              <div className="-m-1.5">
                {filterGroups.map((group, groupIndex) => {
                  const firstItem = first(group)
                  const firstItemIndex = filters.findIndex((x) => x === firstItem)
                  const isSingleFilter = filters.length === 1

                  const groupColors = [
                    'bg-amber-50 dark:bg-amber-700',
                    'bg-teal-50 dark:bg-teal-700',
                    'bg-purple-50 dark:bg-purple-700',
                  ]

                  const color =
                    !isSingleFilter && firstItem && firstItem.operator === 'or'
                      ? groupColors[firstItemIndex % groupColors.length]
                      : null

                  return (
                    <div key={groupIndex} className={clsx('space-y-3 p-1.5', color)}>
                      {group.map((filter) => {
                        const option = options.find((x) => x.name === filter.option)

                        if (!option) {
                          return null
                        }

                        const operatorDisabled = filter === last(filters)

                        return (
                          <SortableItem
                            key={filter.id}
                            id={filter.id}
                            className="flex items-center gap-2"
                          >
                            <Select
                              value={filter.option}
                              onChange={(e) => {
                                setFilters((state) =>
                                  state.map((x) => {
                                    return x !== filter
                                      ? x
                                      : (getAllPossibleFilters().find(
                                          (x) => x.option === e.target.value,
                                        ) ?? x)
                                  }),
                                )
                              }}
                            >
                              {options.map(({ name }) => (
                                <option key={name} value={name}>
                                  {name}
                                </option>
                              ))}
                            </Select>

                            {option.suboptions.length > 0 && (
                              <Select
                                value={filter.suboption}
                                onChange={(e) => {
                                  setFilters((state) =>
                                    state.map((x) => {
                                      return x !== filter
                                        ? x
                                        : { ...filter, suboption: e.target.value }
                                    }),
                                  )
                                }}
                              >
                                {option.suboptions.map((name) => (
                                  <option key={name} value={name}>
                                    {name}
                                  </option>
                                ))}
                              </Select>
                            )}

                            <Select
                              value={filter.condition}
                              onChange={(e) => {
                                setFilters((state) =>
                                  state.map((x) => {
                                    return x !== filter
                                      ? x
                                      : { ...filter, condition: e.target.value }
                                  }),
                                )
                              }}
                            >
                              {option.conditions.map((item) => (
                                <option key={item} value={item}>
                                  {item}
                                </option>
                              ))}
                            </Select>

                            {option.type === 'select' && (
                              <Select
                                className="min-w-0 flex-1"
                                value={filter.value}
                                disabled={!filter.condition}
                                onChange={(e) => {
                                  setFilters((state) =>
                                    state.map((x) => {
                                      return x !== filter ? x : { ...filter, value: e.target.value }
                                    }),
                                  )
                                }}
                              >
                                <option value="">any</option>
                                {option.values.map((name) => (
                                  <option key={name} value={name}>
                                    {name}
                                  </option>
                                ))}
                              </Select>
                            )}
                            {(option.type === 'text' || option.type === 'number') && (
                              <div className="flex-1">
                                <input
                                  type={option.type}
                                  placeholder={option.placeholder}
                                  className="w-full rounded bg-gray-200 px-2 py-0.5 dark:bg-zinc-700"
                                  value={filter.value}
                                  onFocus={(e) => e.target.select()}
                                  onChange={(e) => {
                                    setFilters((state) =>
                                      state.map((x) => {
                                        return x !== filter
                                          ? x
                                          : { ...filter, value: e.target.value }
                                      }),
                                    )
                                  }}
                                />
                              </div>
                            )}

                            <Select
                              className={clsx(
                                'transition-all',
                                !isDragging && !isSingleFilter && 'translate-y-5',
                                !isDragging && operatorDisabled && 'opacity-0',
                              )}
                              disabled={operatorDisabled}
                              value={filter.operator}
                              onChange={(e) => {
                                setFilters((state) => {
                                  const filterIndex = state.findIndex((x) => x === filter)
                                  const shouldUpdateLastFilter = filterIndex === state.length - 2
                                  const lastFilter = last(state)

                                  return state.map((x) => {
                                    return x === filter ||
                                      (shouldUpdateLastFilter && x === lastFilter)
                                      ? { ...x, operator: e.target.value }
                                      : x
                                  })
                                })
                              }}
                            >
                              {operators.map((item) => (
                                <option key={item} value={item}>
                                  {item}
                                </option>
                              ))}
                            </Select>

                            <Tooltip content="Remove filter">
                              <button
                                className="ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded bg-gray-200 text-xs text-red-900"
                                onClick={() => {
                                  setFilters((state) => state.filter((x) => x !== filter))
                                }}
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-4 w-4"
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              </button>
                            </Tooltip>
                          </SortableItem>
                        )
                      })}
                    </div>
                  )
                })}
              </div>
            )}
          </SortableContext>
        </DndContext>

        <div className="flex items-center justify-between">
          <Tooltip
            content={`Maximum ${maxFilters} filters at this moment`}
            disabled={filters.length < maxFilters}
          >
            <div>
              <button
                className="rounded border px-4 py-2 transition-colors hover:bg-gray-100 dark:hover:bg-zinc-800"
                disabled={filters.length >= maxFilters}
                onClick={() => {
                  setFilters((state) => {
                    const lastFilter = last(state)
                    const lastOperator = lastFilter?.operator
                    const option =
                      (lastOperator === 'and' &&
                        options.find((x) => !filters.find((f) => f.option === x.name))) ||
                      options.find((x) => x.name === lastFilter?.option) ||
                      first(options)

                    if (!option) {
                      return state
                    }

                    return [
                      ...state,
                      {
                        id: Math.random().toString(),
                        option: option.name,
                        suboption: option.suboptions[0],
                        condition: option.conditions[0],
                        value: '',
                        operator: lastOperator ?? operators[0],
                      },
                    ]
                  })
                }}
              >
                + Add filter
              </button>
            </div>
          </Tooltip>

          {onDelete && (
            <button
              className="rounded border border-transparent px-4 py-2 transition-all hover:border-red-500 hover:text-red-500"
              onClick={() => {
                onDelete()
              }}
            >
              Delete
            </button>
          )}

          {onSubmit && (
            <button
              className="rounded border border-current bg-gray-800 px-4 py-2 text-white transition-colors hover:bg-gray-700"
              onClick={() => {
                const nonEmptyFilters = filters.filter((x) => x.value)
                const currentQuery = qs.parse(searchParams?.toString() ?? '')
                const query = { ...currentQuery, filter: filtersToQuery(nonEmptyFilters) }

                onSubmit(nonEmptyFilters)

                if (replaceQuery) {
                  window.history.replaceState(null, '', `?${stringifyQuery(query)}`)
                }
              }}
            >
              This is how I like it!
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
