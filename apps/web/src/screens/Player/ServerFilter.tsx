import { ServerStackIcon } from '@heroicons/react/24/outline'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { Dialog, DialogClose, DialogContent, DialogTrigger } from '~/components/ui/Dialog'
import { formatNumber, pluralize } from '~/utils'
import { usePlayerPageContext } from './context'

export const ServerFilter = () => {
  const { servers, filter } = usePlayerPageContext()
  const router = useRouter()
  const pathname = usePathname()
  const [selected, setSelected] = useState<string[]>([])

  if (servers.length < 2) {
    return null
  }

  const toggle = (abbreviation: string) => {
    setSelected((state) =>
      state.includes(abbreviation)
        ? state.filter((item) => item !== abbreviation)
        : [...state, abbreviation],
    )
  }

  const apply = () => {
    const isAll = selected.length === servers.length

    router.push(isAll ? pathname : `${pathname}?servers=${selected.join(',').toLowerCase()}`)
  }

  return (
    <Dialog
      onOpenChange={(open) => {
        if (open) {
          setSelected(filter.servers ?? servers.map((server) => server.abbreviation))
        }
      }}
    >
      <DialogTrigger className="flex items-center gap-1 rounded border border-gray-300 px-1 py-0.5 text-sm text-gray-600 transition hover:border-emerald-500 hover:text-emerald-600 dark:border-zinc-600 dark:text-gray-300 dark:hover:border-emerald-500 dark:hover:text-emerald-500">
        <ServerStackIcon className="h-4 w-4" />
        {filter.servers ? filter.servers.join(', ') : 'All servers'}
      </DialogTrigger>
      <DialogContent
        title="Filter by server"
        description="Show stats based only on games played on the selected servers."
      >
        <div className="flex flex-col gap-2">
          {servers.map((server) => (
            <label key={server.abbreviation} className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={selected.includes(server.abbreviation)}
                onChange={() => toggle(server.abbreviation)}
              />
              {server.abbreviation}
              <span className="text-sm text-gray-400">
                {formatNumber(server.games)} {pluralize('game', server.games)}
              </span>
            </label>
          ))}
        </div>
        <div className="mt-4 flex items-center justify-between gap-4">
          <button
            className="text-sm text-blue-400 hover:underline"
            onClick={() =>
              setSelected(
                selected.length === servers.length
                  ? []
                  : servers.map((server) => server.abbreviation),
              )
            }
          >
            {selected.length === servers.length ? 'Deselect all' : 'Select all'}
          </button>
          <DialogClose
            disabled={selected.length === 0}
            className="rounded bg-emerald-600 px-3 py-1 text-sm text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={apply}
          >
            Apply
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  )
}
