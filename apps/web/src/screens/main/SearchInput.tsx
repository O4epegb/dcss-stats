'use client'

import { Autocomplete } from '@base-ui/react/autocomplete'
import { useDebouncedEffect } from '@react-hookz/web'
import { escapeRegExp, orderBy, startsWith } from 'lodash-es'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useState, useCallback } from 'react'
import useSWRImmutable from 'swr/immutable'
import { api } from '~/api'
import { Player } from '~/types'

type SearchItem = Player

export const SearchInput = ({ nickname }: { nickname: string }) => {
  const [query, setQuery] = useState('')

  const router = useRouter()
  const [debouncedQuery, setDebouncedQuery] = useState('')

  useDebouncedEffect(() => setDebouncedQuery(query), [query], 400)

  const { data } = useSWRImmutable(
    ['/players', debouncedQuery],
    ([url, query]) => {
      return !query
        ? undefined
        : api.get<{ data: Array<SearchItem> }>(url, { params: { query } }).then((res) => {
            const target = query.toLowerCase()
            return orderBy(res.data.data, (x) => startsWith(x.name.toLowerCase(), target), 'desc')
          })
    },
    { keepPreviousData: true },
  )
  const showLoader = !data
  const items = data ?? []

  const goToPlayerPage = useCallback((slug: string) => {
    router.push(`/players/${slug}`)
  }, [])

  return (
    <Autocomplete.Root
      items={items}
      mode="none"
      autoHighlight={false}
      itemToStringValue={(item: SearchItem) => item.name}
      openOnInputClick={false}
    >
      <Autocomplete.InputGroup className="flex">
        <Autocomplete.Input
          placeholder={`Search player by nickname, e.g. "${nickname}"`}
          className="block h-10 w-full rounded-l-sm border border-gray-400 px-2 text-ellipsis"
          value={query}
          onChange={(e) => {
            setQuery(e.currentTarget.value.trim())
          }}
          onFocus={(e) => {
            e.currentTarget.select()
          }}
        />
        <button
          type="button"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-r-sm border border-l-0 border-gray-400 bg-gray-100 hover:bg-gray-200 dark:bg-zinc-700 dark:hover:bg-zinc-600"
          onClick={() => query && goToPlayerPage(query)}
        >
          <Image
            src="/i-identify.png"
            alt="Search"
            width={32}
            height={32}
            className="pixelated pointer-events-none relative -top-[7px] -left-2"
          />
        </button>
      </Autocomplete.InputGroup>

      <Autocomplete.Portal>
        <Autocomplete.Positioner sideOffset={4} className="z-20">
          <Autocomplete.Popup className="w-(--anchor-width) rounded-md border border-gray-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-800">
            {showLoader && (
              <Autocomplete.Status className="px-3 py-2 text-sm text-gray-500 dark:text-zinc-400">
                {query ? 'Loading...' : 'Type to search'}
              </Autocomplete.Status>
            )}
            {!showLoader && items.length === 0 && debouncedQuery && (
              <Autocomplete.Empty className="px-3 py-2 text-sm text-gray-500 dark:text-zinc-400">
                Nothing found
              </Autocomplete.Empty>
            )}
            {items.length > 0 && (
              <Autocomplete.List className="max-h-64 overflow-y-auto p-1">
                {(item: SearchItem) => (
                  <Autocomplete.Item
                    key={item.name}
                    value={item}
                    className="cursor-default rounded-sm px-3 py-1.5 text-sm data-highlighted:bg-gray-100 dark:data-highlighted:bg-zinc-700"
                    onClick={() => {
                      goToPlayerPage(item.name)
                    }}
                  >
                    <Highlighted text={item.name} query={debouncedQuery} />
                  </Autocomplete.Item>
                )}
              </Autocomplete.List>
            )}
          </Autocomplete.Popup>
        </Autocomplete.Positioner>
      </Autocomplete.Portal>
    </Autocomplete.Root>
  )
}

export const Highlighted = ({ text, query }: { text: string; query: string }) => {
  const trimmedQuery = query.trim()

  if (!trimmedQuery) {
    return <span>{text}</span>
  }

  const regex = new RegExp(`(${escapeRegExp(trimmedQuery)})`, 'gi')
  const parts = text.split(regex)

  return (
    <span>
      {parts
        .filter(Boolean)
        .map((part, i) => (regex.test(part) ? <b key={i}>{part}</b> : <span key={i}>{part}</span>))}
    </span>
  )
}
