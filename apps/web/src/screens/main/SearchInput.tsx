'use client'

import { Autocomplete } from '@base-ui/react/autocomplete'
import { useDebouncedEffect } from '@react-hookz/web'
import { escapeRegExp, orderBy, startsWith } from 'lodash-es'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useCallback, useRef, useState } from 'react'
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

  const highlightedRef = useRef<SearchItem | null>(null)

  return (
    <Autocomplete.Root
      mode="none"
      autoHighlight={false}
      openOnInputClick={false}
      items={items}
      value={query}
      itemToStringValue={(item: SearchItem) => item.name}
      onValueChange={setQuery}
      onItemHighlighted={(item) => {
        highlightedRef.current = item ?? null
      }}
    >
      <Autocomplete.InputGroup className="flex">
        <Autocomplete.Input
          placeholder={`Search player by nickname, e.g. "${nickname}"`}
          className="border-border-strong bg-surface block h-10 w-full rounded-l-sm border px-2 text-ellipsis"
          onFocus={(e) => {
            e.currentTarget.select()
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !highlightedRef.current && query) {
              e.preventDefault()
              goToPlayerPage(query)
            }
          }}
        />
        <button
          type="button"
          className="border-border-strong bg-surface-emphasis hover:bg-surface-active flex h-10 w-10 shrink-0 items-center justify-center rounded-r-sm border border-l-0 select-none"
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
          <Autocomplete.Popup className="border-border bg-surface shadow-shadow/10 w-(--anchor-width) rounded-md border shadow-lg">
            {showLoader && (
              <Autocomplete.Status className="text-muted-foreground px-3 py-2 text-sm">
                {query ? 'Loading...' : 'Type to search'}
              </Autocomplete.Status>
            )}
            {!showLoader && items.length === 0 && debouncedQuery && (
              <Autocomplete.Empty className="text-muted-foreground px-3 py-2 text-sm">
                Nothing found
              </Autocomplete.Empty>
            )}
            {items.length > 0 && (
              <Autocomplete.List className="max-h-64 overflow-y-auto p-1">
                {(item: SearchItem) => (
                  <Autocomplete.Item
                    key={item.name}
                    value={item}
                    className="data-highlighted:bg-surface-hover cursor-default rounded-sm px-3 py-1.5 text-sm"
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
