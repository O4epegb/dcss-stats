import { useState, useEffect, FC } from 'react';
import clsx from 'clsx';
import { GetStaticProps } from 'next';
import { orderBy, castArray, pickBy, last, flatten, first } from 'lodash-es';
import { useRouter } from 'next/router';
import useSWRInfinite from 'swr/infinite';
import { api } from '@api';
import { Class, Game, God, Race } from '@types';
import { formatNumber, notEmpty } from '@utils';
import { createServerApi } from '@api/server';
import { Logo } from '@components/Logo';
import { Loader } from '@components/Loader';
import { GameItem } from '@components/GameItem';
import { Tooltip } from '@components/Tooltip';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import {
  useSortable,
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';

// Order by
// Hotkey for submit
// Add version filter?
// send options from BE
// send maximum filters from the backend
// use endAt date for search, not startAt

const SortableItem: FC<{ id: string; className: string }> = ({ id, className, children }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={clsx(className, 'relative', isDragging && 'z-10')}
    >
      <button
        {...attributes}
        {...listeners}
        className="absolute right-full mr-2 flex items-center justify-center w-6 h-6 text-gray-300 hover:text-black hover:bg-gray-200 rounded transition-colors"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-4 h-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="9" cy="12" r="1"></circle>
          <circle cx="9" cy="5" r="1"></circle>
          <circle cx="9" cy="19" r="1"></circle>
          <circle cx="15" cy="12" r="1"></circle>
          <circle cx="15" cy="5" r="1"></circle>
          <circle cx="15" cy="19" r="1"></circle>
        </svg>
      </button>
      {children}
    </div>
  );
};

const SearchPage = ({ races, classes, gods }: Props) => {
  const router = useRouter();
  const sensors = useSensors(useSensor(PointerSensor));
  const [isDragging, setIsDragging] = useState(false);

  const operators = ['and', 'or'] as [string, string];
  const conditions = ['is', 'is not'];
  const options = [
    {
      name: 'Race',
      type: 'select',
      conditions,
      values: races.map((x) => ({ name: x.name })),
    },
    {
      name: 'Class',
      type: 'select',
      conditions,
      values: classes.map((x) => ({ name: x.name })),
    },
    {
      name: 'God',
      type: 'select',
      conditions,
      values: gods.map((x) => ({ name: x.name })),
    },
    {
      name: 'End',
      type: 'select',
      conditions,
      values: ['Escaped', 'Defeated'].map((x) => ({ name: x })),
    },
    {
      name: 'Player',
      type: 'text',
      conditions,
    },
  ] as const;

  type Filter = {
    id: string;
    option: string;
    condition: string;
    value: string | undefined;
    operator: string;
  };

  const [filters, setFilters] = useState<Filter[]>(() => []);
  const [filterForSearch, setFilterForSearch] = useState<Filter[] | null>(() => null);

  // TODO error isAxiosError
  const { data, error, size, setSize } = useSWRInfinite<{ data: Game[]; count: number }>(
    (pageIndex, previousPageData) => {
      if (!filterForSearch || (previousPageData && previousPageData.data.length === 0)) {
        return null;
      }

      return ['/search', { filter: filterForSearch, after: last(previousPageData?.data)?.id }];
    },
    (url, params) =>
      api.get(url, { params: pickBy(params, (value) => value != null) }).then((res) => res.data),
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      revalidateFirstPage: false,
    },
  );

  const games = data ? flatten(data.map((x) => x.data)) : [];
  const isLoadingInitialData = !data && !error;
  const isLoadingMore =
    isLoadingInitialData || (size > 0 && data && typeof data[size - 1] === 'undefined');
  const isEmpty = data?.[0].data?.length === 0;
  const isReachingEnd = isEmpty || (data && data[data.length - 1]?.data?.length < 10);

  const getDefaultFilters = () =>
    options.map(({ name, conditions }) => {
      return {
        id: Math.random().toString(),
        option: name,
        condition: conditions[0],
        operator: operators[0],
        value: '',
      };
    });

  useEffect(() => {
    if (!router.isReady) {
      return;
    }

    const queryFilters = castArray(router.query.filter).filter(notEmpty);

    let potentialFilters: Filter[] = queryFilters
      .map((item) => {
        const [option, condition, value, operator] = item.split('_');

        const optionItem = options.find((x) => x.name === option);

        const isValid =
          optionItem &&
          (optionItem.type !== 'select' || optionItem.values.find((x) => x.name === value)) &&
          optionItem.conditions.includes(condition) &&
          (!operator || operators.includes(operator));

        if (!isValid) {
          return;
        }

        return {
          id: Math.random().toString(),
          option,
          condition,
          value,
          operator: operator ?? operators[0],
        };
      })
      .filter(notEmpty);

    if (potentialFilters.length > 1) {
      const lastOne = potentialFilters[potentialFilters.length - 1];
      lastOne.operator = potentialFilters[potentialFilters.length - 2].operator;
    }

    if (potentialFilters.length !== queryFilters.length) {
      router.replace(
        {
          query: {},
        },
        undefined,
        { shallow: true },
      );
    } else if (queryFilters.length === 0) {
      potentialFilters = getDefaultFilters();
    }

    const nonEmptyFilters = potentialFilters.filter((x) => x.value && x.condition);

    setFilterForSearch(nonEmptyFilters.length > 0 ? nonEmptyFilters : []);
    setFilters(potentialFilters);
  }, [router.isReady]);

  const filterGroups = filters
    .reduce(
      (acc, item, index) => {
        const prev = filters[index - 1];
        const next = filters[index + 1];
        last(acc)?.push(item);

        if (
          next &&
          item.operator === 'and' &&
          (prev?.operator === 'or' || next?.operator === 'or')
        ) {
          acc.push([]);
        }

        return acc;
      },
      [[]] as Array<Filter[]>,
    )
    .filter((x) => x.length > 0);

  return (
    <div className="container mx-auto px-4 min-h-screen flex flex-col pt-4 pb-4 space-y-4 h-screen max-h-screen">
      <header className="flex items-center gap-2 divide-x">
        <Logo />
        <h2 className="pl-2 text-2xl">Search</h2>
      </header>
      <div className="grid sm:grid-cols-2 gap-4 flex-1 min-h-0">
        <div className="space-y-4">
          <div className="w-full bg-blue-100 rounded px-2 py-1 text-sm">
            This page in under development, with bugs and suggestions DM @totalnoob on{' '}
            <a
              href="https://discord.gg/pKCNTunFeW"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              RL Discord
            </a>{' '}
            or create an issue on{' '}
            <a
              href="https://github.com/O4epegb/dcss-stats"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              Github
            </a>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-1">
              <div className="text-xl">Filters</div>
              <Tooltip
                content={
                  <>
                    Filters are grouped by `OR` operator
                    <br />
                    Groups are color coded for convenience
                  </>
                }
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-gray-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
                    clipRule="evenodd"
                  />
                </svg>
              </Tooltip>
              <button
                className="ml-auto p-1 -mr-1 rounded hover:bg-gray-100"
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
                  const { active, over } = event;

                  setIsDragging(false);

                  if (over && active.id !== over.id) {
                    setFilters((items) => {
                      const oldIndex = items.findIndex((x) => x.id === active.id);
                      const newIndex = items.findIndex((x) => x.id === over.id);

                      return arrayMove(items, oldIndex, newIndex);
                    });
                  }
                }}
              >
                <SortableContext items={filters} strategy={verticalListSortingStrategy}>
                  {filterGroups.length > 0 && (
                    <div className="-m-1.5">
                      {filterGroups.map((group, groupIndex) => {
                        const firstItem = first(group);
                        const firstItemIndex = filters.findIndex((x) => x === firstItem);
                        const singleFilter = filters.length === 1;

                        const colors = ['bg-amber-50', 'bg-teal-50', 'bg-purple-50'];

                        const color =
                          !singleFilter && firstItem && firstItem.operator === 'or'
                            ? colors[firstItemIndex % 3]
                            : null;

                        return (
                          <div key={groupIndex} className={clsx('p-1.5 space-y-3', color)}>
                            {group.map((filter) => {
                              const option = options.find((x) => x.name === filter.option);

                              if (!option) {
                                return null;
                              }

                              const disabled = !singleFilter && filter === last(filters);

                              return (
                                <SortableItem
                                  key={filter.id}
                                  id={filter.id}
                                  className="flex items-center gap-2"
                                >
                                  <select
                                    className="rounded py-1 pl-1 bg-gray-200"
                                    value={filter.option}
                                    onChange={(e) => {
                                      setFilters((state) =>
                                        state.map((x) => {
                                          return x !== filter
                                            ? x
                                            : {
                                                ...filter,
                                                option: e.target.value,
                                                value: undefined,
                                              };
                                        }),
                                      );
                                    }}
                                  >
                                    {options.map(({ name }) => (
                                      <option key={name} value={name}>
                                        {name}
                                      </option>
                                    ))}
                                  </select>

                                  <select
                                    className="rounded py-1 pl-1 bg-gray-200"
                                    value={filter.condition}
                                    disabled={!filter.option}
                                    onChange={(e) => {
                                      setFilters((state) =>
                                        state.map((x) => {
                                          return x !== filter
                                            ? x
                                            : { ...filter, condition: e.target.value };
                                        }),
                                      );
                                    }}
                                  >
                                    {option.conditions.map((item) => (
                                      <option key={item} value={item}>
                                        {item}
                                      </option>
                                    ))}
                                  </select>
                                  {option.type === 'select' && (
                                    <select
                                      className="min-w-0 rounded flex-1 py-1 pl-1 bg-gray-200"
                                      value={filter.value}
                                      disabled={!filter.condition}
                                      onChange={(e) => {
                                        setFilters((state) =>
                                          state.map((x) => {
                                            return x !== filter
                                              ? x
                                              : { ...filter, value: e.target.value };
                                          }),
                                        );
                                      }}
                                    >
                                      <option value="">any</option>
                                      {option.values.map(({ name }) => (
                                        <option key={name} value={name}>
                                          {name}
                                        </option>
                                      ))}
                                    </select>
                                  )}
                                  {option.type === 'text' && (
                                    <div className="flex-1">
                                      <input
                                        type="text"
                                        placeholder="Enter player name"
                                        className="w-full rounded py-0.5 px-2 bg-gray-200"
                                        value={filter.value}
                                        onChange={(e) => {
                                          setFilters((state) =>
                                            state.map((x) => {
                                              return x !== filter
                                                ? x
                                                : { ...filter, value: e.target.value };
                                            }),
                                          );
                                        }}
                                      />
                                    </div>
                                  )}

                                  <select
                                    className={clsx(
                                      'rounded py-1 pl-1 bg-gray-200 transition-all',
                                      !isDragging && !singleFilter && 'translate-y-5',
                                      !isDragging && disabled && 'opacity-0',
                                    )}
                                    disabled={disabled}
                                    value={filter.operator}
                                    onChange={(e) => {
                                      setFilters((state) => {
                                        const filterIndex = state.findIndex((x) => x === filter);
                                        const shouldUpdateLastFilter =
                                          filterIndex === state.length - 2;
                                        const lastFilter = last(state);

                                        return state.map((x) => {
                                          return x === filter ||
                                            (shouldUpdateLastFilter && x === lastFilter)
                                            ? { ...x, operator: e.target.value }
                                            : x;
                                        });
                                      });
                                    }}
                                  >
                                    {operators.map((item) => (
                                      <option key={item} value={item}>
                                        {item}
                                      </option>
                                    ))}
                                  </select>

                                  <Tooltip content="Remove filter">
                                    <button
                                      className="flex shrink-0 items-center justify-center ml-auto w-6 h-6 bg-gray-200 rounded text-xs text-red-900"
                                      onClick={() => {
                                        setFilters((state) => state.filter((x) => x !== filter));
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
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </SortableContext>
              </DndContext>

              <div className="flex justify-between items-center">
                <Tooltip content="Maximum 10 filters at this moment" disabled={filters.length < 10}>
                  <div>
                    <button
                      className="rounded border px-4 py-2 transition-colors hover:bg-gray-100"
                      disabled={filters.length >= 10}
                      onClick={() => {
                        setFilters((state) => {
                          const lastFilter = last(state);
                          const operator = last(state)?.operator;
                          const option =
                            operator === 'and'
                              ? options.find((x) => !filters.find((f) => f.option === x.name))
                              : options.find((x) => x.name === lastFilter?.option);

                          return [
                            ...state,
                            {
                              id: Math.random().toString(),
                              operator: operator ?? operators[0],
                              option: option?.name ?? options[0].name,
                              condition: option?.conditions[0] ?? options[0].conditions[0],
                              value: '',
                            },
                          ];
                        });
                      }}
                    >
                      + Add filter
                    </button>
                  </div>
                </Tooltip>

                <button
                  className="rounded border border-current px-4 py-2 transition-colors bg-gray-800 text-white hover:bg-gray-700"
                  onClick={() => {
                    const nonEmptyFilters = filters.filter((x) => x.value && x.condition);

                    setFilterForSearch(nonEmptyFilters.length ? nonEmptyFilters : []);

                    const filter = nonEmptyFilters.map(
                      ({ option, condition, value, operator }, index) => {
                        return [
                          option,
                          condition,
                          value,
                          index === nonEmptyFilters.length - 1 ? null : operator,
                        ]
                          .filter(notEmpty)
                          .join('_');
                      },
                    );

                    router.replace({ query: { filter } }, undefined, { shallow: true });
                  }}
                >
                  This is how I like it!
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col min-h-0">
          <div className="text-xl">Total: {formatNumber(first(data)?.count ?? 0)}</div>
          <div className="flex-1 sm:overflow-y-auto py-2 pr-2">
            {isEmpty ? (
              <div className="flex justify-center items-center py-16">Nothing found ¯\_(ツ)_/¯</div>
            ) : (
              <ul className="space-y-2">
                {games.map((game) => {
                  return (
                    <li key={game.id}>
                      <GameItem includePlayer game={game} />
                    </li>
                  );
                })}
              </ul>
            )}

            {!isEmpty && !error && (
              <div className="flex justify-center items-center pt-8 pb-4">
                <button
                  className="flex justify-center items-center space-x-1"
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

            {error && (
              <div className="flex flex-col justify-center items-center pt-8 pb-4">
                <div>Error occured, try to reload the page</div>
                {error.message && <code className="p-2 bg-gray-100">{String(error.message)}</code>}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

type Props = Response;

type Response = {
  races: Race[];
  classes: Class[];
  gods: God[];
};

export const getStaticProps: GetStaticProps<Props> = async () => {
  const { data } = await createServerApi().api.get<Response>('/combos');

  return {
    revalidate: 300,
    props: {
      races: orderBy(data.races, [(x) => x.trunk, (x) => x.name], ['desc', 'asc']),
      classes: orderBy(data.classes, [(x) => x.trunk, (x) => x.name], ['desc', 'asc']),
      gods: orderBy(data.gods, (x) => x.name.toLowerCase()),
    },
  };
};

export default SearchPage;
