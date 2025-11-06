'use client'

import { useDebouncedEffect } from '@react-hookz/web'
import clsx from 'clsx'
import { useCombobox } from 'downshift'
import { escapeRegExp, orderBy, startsWith } from 'lodash-es'
import { useRouter } from 'next/navigation'
import { useState, useCallback } from 'react'
import useSWRImmutable from 'swr/immutable'
import { api } from '~/api'
import { Loader } from '~/components/ui/Loader'
import { Player } from '~/types'

type SearchItem = Player

export const SearchInput = ({ nickname }: { nickname: string }) => {
  const [query, setQuery] = useState('')
  const [isNavigating, setIsNavigating] = useState(false)

  const router = useRouter()
  const [debouncedQuery, setDebouncedQuery] = useState('')

  useDebouncedEffect(() => setDebouncedQuery(query), [query], 400)

  const { data, isLoading } = useSWRImmutable(
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
  const showLoader = !data && isLoading
  const items = data ?? []

  const goToPlayerPage = useCallback((slug: string) => {
    setIsNavigating(true)
    router.push(`/players/${slug}`)
  }, [])

  const { isOpen, highlightedIndex, getInputProps, getMenuProps, getItemProps } = useCombobox({
    id: 'MainSearch',
    items,
    inputValue: query,
    onSelectedItemChange: (e) => {
      if (e.selectedItem) {
        setQuery(e.selectedItem.name)
        goToPlayerPage(e.selectedItem.name)
      }
    },
  })

  return (
    <div className="relative">
      {isNavigating && (
        <div className="absolute top-[50%] right-2 -translate-y-1/2">
          <Loader />
        </div>
      )}

      <input
        placeholder={`Search player by nickname, e.g. "${nickname}"`}
        className="block h-10 w-full rounded-sm border border-gray-400 px-2"
        {...getInputProps({
          value: query,
          disabled: isNavigating,
          onFocus(e) {
            e.target.select()
          },
          onKeyDown: (e) => {
            if (e.key === 'Enter' && highlightedIndex === -1 && query) {
              ;(e.nativeEvent as any).preventDownshiftDefault = true
              goToPlayerPage(query)
            }
          },
          onChange: (e) => {
            setQuery(e.currentTarget.value.trim())
          },
        })}
      />

      <div
        className={clsx(
          'absolute top-full left-0 z-20 mt-2 w-full overflow-hidden rounded-sm shadow-sm',
          isOpen ? 'block' : 'hidden',
        )}
      >
        <ul {...getMenuProps()} className="max-h-64 overflow-y-auto bg-white py-2 dark:bg-zinc-800">
          {isOpen && (
            <>
              {showLoader ? (
                <li className="flex justify-center">Loading...</li>
              ) : (
                <>
                  {items.length === 0 && (
                    <li className="flex justify-center">
                      {debouncedQuery ? 'Nothing found' : 'Specify your request'}
                    </li>
                  )}
                  {items.map((item, index) => {
                    const active = items[highlightedIndex] === item

                    return (
                      <li
                        key={index}
                        className={clsx('px-2', active && 'bg-gray-100 dark:bg-zinc-700')}
                        {...getItemProps({
                          item,
                          index,
                        })}
                      >
                        <Highlighted text={item.name} query={debouncedQuery} />
                      </li>
                    )
                  })}
                </>
              )}
            </>
          )}
        </ul>
      </div>
    </div>
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
