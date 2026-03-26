'use client'

import { Drawer } from '@base-ui/react/drawer'
import type { MonsterData } from '@dcss-stats/extractor/monsterCatalog'
import { ChevronUpIcon, ChevronDownIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { useLocalStorageValue, useMediaQuery } from '@react-hookz/web'
import { orderBy } from 'lodash-es'
import { useMemo, useState } from 'react'
import { cn, pluralize } from '~/utils'

const TILE_BASE_URL =
  'https://raw.githubusercontent.com/crawl/crawl/9261420e9b7a3246420c534c70f4b09402a670ab/crawl-ref/source/rltiles'

function getTileUrl(tilePath?: string): string | null {
  if (!tilePath) return null
  return `${TILE_BASE_URL}/${tilePath}`
}

function numValue(v: unknown): number | null {
  if (typeof v === 'number') return v
  if (typeof v === 'string') {
    const m = v.match(/\d+/)
    return m ? Number(m[0]) : null
  }
  return null
}

function formatSpeed(speed: MonsterData['speed']): string {
  if (!speed) {
    return '-'
  }

  const parts: string[] = []
  if (speed.energy_costs.move !== 10) parts.push(`move: ${speed.energy_costs.move * 10}%`)
  if (speed.energy_costs.attack !== 10) parts.push(`atk: ${speed.energy_costs.attack * 10}%`)
  if (speed.energy_costs.missile !== 10) parts.push(`msl: ${speed.energy_costs.missile * 10}%`)
  if (speed.energy_costs.spell !== 10) parts.push(`spell: ${speed.energy_costs.spell * 10}%`)
  if (speed.energy_costs.swim !== 10 && speed.energy_costs.swim !== speed.energy_costs.move)
    parts.push(`swim: ${speed.energy_costs.swim * 10}%`)
  if (speed.stationary) parts.push('stationary')
  if (parts.length === 0) return `${speed.base}`
  return `${speed.base} (${parts.join('; ')})`
}

export function MonsterTable({ monsters }: { monsters: MonsterData[] }) {
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<string>('name')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [selected, setSelected] = useState<MonsterData | null>(null)
  const [displayed, setDisplayed] = useState<MonsterData | null>(null)
  const showTiles = useLocalStorageValue('monsters-show-tiles', { defaultValue: true })
  const isMobile = useMediaQuery('(max-width: 767px)', { initializeWithValue: false })

  const select = (monster: MonsterData | null) => {
    setSelected(monster)
    if (monster) setDisplayed(monster)
  }

  const toggleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const filtered = useMemo(() => {
    const list = search
      ? monsters.filter(
          (m) =>
            m.name.toLowerCase().includes(search.toLowerCase()) ||
            m.flags.some((f) => f.toLowerCase().includes(search.toLowerCase())) ||
            m.resistances.some((r) => r.toLowerCase().includes(search.toLowerCase())),
        )
      : monsters

    return orderBy(
      list,
      (m) => {
        const v = m[sortKey as keyof MonsterData]
        if (v != null && typeof v === 'object' && 'base' in v) return (v as { base: number }).base
        return numValue(v) ?? v
      },
      sortDir,
    )
  }, [monsters, search, sortKey, sortDir])

  return (
    <>
      <div className="space-y-3">
        <input
          type="text"
          placeholder="Search monsters..."
          value={search}
          className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm outline-none placeholder:text-gray-400 focus:border-emerald-500 dark:border-zinc-700 dark:bg-zinc-900 dark:placeholder:text-zinc-500 dark:focus:border-emerald-500"
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className="flex items-center justify-between gap-3">
          <div className="text-xs text-gray-500 dark:text-zinc-400">
            {filtered.length} {pluralize('monster', filtered.length)}
          </div>
          <button
            type="button"
            className="flex items-center gap-1.5 rounded px-2 py-1 text-xs text-gray-600 transition-colors hover:bg-gray-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
            onClick={() => showTiles.set(!showTiles.value)}
          >
            <span
              className={cn(
                'relative inline-flex h-4 w-7 shrink-0 rounded-full transition-colors',
                showTiles.value ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-zinc-600',
              )}
            >
              <span
                className={cn(
                  'pointer-events-none mt-0.5 inline-block h-3 w-3 translate-x-0.5 rounded-full bg-white shadow transition-transform',
                  showTiles.value && 'translate-x-3.5',
                )}
              />
            </span>
            Tiles
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-xs font-medium text-gray-500 dark:border-zinc-700 dark:text-zinc-400">
                <th className="py-2 pr-2"></th>
                <SortTh
                  label="Name"
                  sortKey="name"
                  active={sortKey}
                  dir={sortDir}
                  onSort={toggleSort}
                />
                <SortTh
                  label="HD"
                  sortKey="hd"
                  active={sortKey}
                  dir={sortDir}
                  onSort={toggleSort}
                />
                <SortTh
                  label="HP"
                  sortKey="hp"
                  active={sortKey}
                  dir={sortDir}
                  onSort={toggleSort}
                />
                <SortTh
                  label="AC"
                  sortKey="ac"
                  active={sortKey}
                  dir={sortDir}
                  className="text-center"
                  onSort={toggleSort}
                />
                <SortTh
                  label="EV"
                  sortKey="ev"
                  active={sortKey}
                  dir={sortDir}
                  className="text-center"
                  onSort={toggleSort}
                />
                <SortTh
                  label="Speed"
                  sortKey="speed"
                  active={sortKey}
                  dir={sortDir}
                  onSort={toggleSort}
                />
                <SortTh
                  label="Size"
                  sortKey="size"
                  active={sortKey}
                  dir={sortDir}
                  onSort={toggleSort}
                />
                <th className="hidden px-2 py-2 xl:table-cell">Resistances</th>
                <th className="hidden px-2 py-2 xl:table-cell">Flags</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((monster) => (
                <tr
                  key={monster.id}
                  className={cn(
                    'cursor-pointer border-b border-gray-100 transition-colors hover:bg-gray-50 dark:border-zinc-800 dark:hover:bg-zinc-800/60',
                    selected?.id === monster.id && 'bg-emerald-50 dark:bg-emerald-900/20',
                  )}
                  onClick={() => select(selected?.id === monster.id ? null : monster)}
                >
                  <td className="shrink-0 py-2 pr-2">
                    <div className="relative w-10">
                      {showTiles.value ? (
                        <TileImage
                          tilePath={monster.tile_path}
                          symbol={monster.symbol}
                          size={32}
                          className="h-8 w-8"
                        />
                      ) : (
                        <SymbolGlyph symbol={monster.symbol} size={32} />
                      )}
                      <span className="absolute -right-0.5 -bottom-0.5 rounded-sm bg-gray-200 px-0.5 text-[9px] leading-3 font-medium text-gray-600 md:hidden dark:bg-zinc-600 dark:text-zinc-300">
                        {monster.symbol}
                      </span>
                    </div>
                  </td>
                  <td className="px-2 py-2 font-medium">
                    {monster.name}
                    {monster.unfinished && (
                      <span className="ml-1 text-xs text-amber-600 dark:text-amber-400">
                        (unfinished)
                      </span>
                    )}
                  </td>
                  <td className="px-2 py-2 tabular-nums">{monster.hd ?? '-'}</td>
                  <td className="px-2 py-2 tabular-nums">{monster.hp}</td>
                  <td className="px-2 py-2 text-center tabular-nums">{monster.ac ?? '-'}</td>
                  <td className="px-2 py-2 text-center tabular-nums">{monster.ev ?? '-'}</td>
                  <td className="px-2 py-2 tabular-nums">{formatSpeed(monster.speed)}</td>
                  <td className="px-2 py-2">{monster.size}</td>
                  <td className="hidden px-2 py-2 xl:table-cell">
                    <TagList items={monster.resistances} />
                  </td>
                  <td className="hidden px-2 py-2 xl:table-cell">
                    <TagList items={monster.flags} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Drawer.Root
        open={selected !== null}
        modal={isMobile}
        disablePointerDismissal={!isMobile}
        swipeDirection={isMobile ? 'down' : undefined}
        onOpenChange={(open: boolean) => {
          if (!open) select(null)
        }}
        onOpenChangeComplete={(open: boolean) => {
          if (!open) setDisplayed(null)
        }}
      >
        <Drawer.Portal>
          {isMobile && (
            <Drawer.Backdrop className="fixed inset-0 min-h-dvh bg-black/20 transition-opacity duration-450 ease-[cubic-bezier(0.32,0.72,0,1)] data-ending-style:opacity-0 data-ending-style:duration-[calc(var(--drawer-swipe-strength)*400ms)] data-starting-style:opacity-0 data-swiping:duration-0 supports-[-webkit-touch-callout:none]:absolute dark:bg-black/70" />
          )}
          <Drawer.Viewport
            className={cn(
              'pointer-events-none fixed inset-0 flex p-0',
              'items-end justify-center md:items-stretch md:justify-end',
            )}
          >
            <Drawer.Popup
              className={cn(
                'pointer-events-auto overflow-y-auto bg-white text-gray-900 outline-1 outline-gray-200',
                'dark:bg-zinc-900 dark:text-zinc-100 dark:outline-zinc-700',
                // mobile: bottom sheet
                'max-h-[85vh] w-full rounded-t-xl pb-[max(1rem,env(safe-area-inset-bottom,0px))]',
                'px-4 pt-3',
                // desktop: right side panel
                'md:h-full md:max-h-none md:w-96 md:max-w-[calc(100vw-3rem)] md:rounded-none md:px-4 md:pt-4 md:pb-4',
                // base animation (slide from right)
                '[transform:translateX(var(--drawer-swipe-movement-x))]',
                'transition-transform duration-450 ease-[cubic-bezier(0.32,0.72,0,1)]',
                'data-[swiping]:select-none',
                'data-[starting-style]:[transform:translateX(calc(100%+2px))]',
                'data-[ending-style]:[transform:translateX(calc(100%+2px))]',
                'data-[ending-style]:duration-[calc(var(--drawer-swipe-strength)*400ms)]',
                // mobile overrides: slide from bottom
                'max-md:[transform:translateY(var(--drawer-swipe-movement-y))]',
                'max-md:data-[starting-style]:[transform:translateY(calc(100%+2px))]',
                'max-md:data-[ending-style]:[transform:translateY(calc(100%+2px))]',
              )}
            >
              {isMobile && (
                <div className="mx-auto mb-3 h-1 w-12 rounded-full bg-gray-300 dark:bg-zinc-600" />
              )}
              <Drawer.Content className="relative">
                <Drawer.Close className="absolute top-0 right-0 rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300">
                  <XMarkIcon className="size-6" />
                </Drawer.Close>

                {displayed && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      {showTiles.value ? (
                        <TileImage
                          tilePath={displayed.tile_path}
                          symbol={displayed.symbol}
                          size={64}
                          className="h-16 w-16"
                        />
                      ) : (
                        <SymbolGlyph symbol={displayed.symbol} size={64} />
                      )}
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate pr-8 text-base font-semibold">{displayed.name}</h3>
                        <div className="text-xs text-gray-500 dark:text-zinc-400">
                          {/* hidden for now, redundant */}
                          {/* {displayed.symbol} &middot; {displayed.size} &middot;{' '}
                          {displayed.intelligence} */}
                        </div>
                      </div>
                    </div>

                    {displayed.description && (
                      <p className="text-xs leading-relaxed text-gray-600 dark:text-zinc-400">
                        {displayed.description.split('\n\n')[0]}
                      </p>
                    )}

                    <div className="rounded border border-gray-200 p-3 dark:border-zinc-700">
                      <div className="text-xs font-medium text-gray-500 dark:text-zinc-400">
                        Stats
                      </div>
                      <dl className="mt-1 space-y-1 text-sm">
                        <div className="flex justify-between">
                          <dt className="text-gray-500 dark:text-zinc-400">HD</dt>
                          <dd>{displayed.hd ?? '-'}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-gray-500 dark:text-zinc-400">HP</dt>
                          <dd>{displayed.hp}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-gray-500 dark:text-zinc-400">AC</dt>
                          <dd>
                            {displayed.ac ?? '-'}
                            {displayed.ac_sim != null && displayed.ac_sim !== displayed.ac && (
                              <span className="ml-1 text-xs text-gray-400 dark:text-zinc-500">
                                ({displayed.ac_sim})
                              </span>
                            )}
                          </dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-gray-500 dark:text-zinc-400">EV</dt>
                          <dd>
                            {displayed.ev ?? '-'}
                            {displayed.ev_sim != null && displayed.ev_sim !== displayed.ev && (
                              <span className="ml-1 text-xs text-gray-400 dark:text-zinc-500">
                                ({displayed.ev_sim})
                              </span>
                            )}
                          </dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-gray-500 dark:text-zinc-400">Speed</dt>
                          <dd>{formatSpeed(displayed.speed)}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-gray-500 dark:text-zinc-400">Size</dt>
                          <dd>{displayed.size}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-gray-500 dark:text-zinc-400">Intelligence</dt>
                          <dd>{displayed.intelligence}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-gray-500 dark:text-zinc-400">XP</dt>
                          <dd>{displayed.xp ?? '-'}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-gray-500 dark:text-zinc-400">Willpower</dt>
                          <dd>
                            {displayed.willpower >= 5000
                              ? '∞'
                              : displayed.willpower > 0
                                ? displayed.willpower
                                : '-'}
                          </dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-gray-500 dark:text-zinc-400">Spell HD</dt>
                          <dd>{displayed.spell_hd}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-gray-500 dark:text-zinc-400">Species</dt>
                          <dd>{displayed.species}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-gray-500 dark:text-zinc-400">Genus</dt>
                          <dd>{displayed.genus}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-gray-500 dark:text-zinc-400">Corpse</dt>
                          <dd>{displayed.corpse ? 'Yes' : 'No'}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-gray-500 dark:text-zinc-400">Shape</dt>
                          <dd>{displayed.shape}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-gray-500 dark:text-zinc-400">Holiness</dt>
                          <dd>{displayed.holiness || '-'}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-gray-500 dark:text-zinc-400">Habitat</dt>
                          <dd>{displayed.habitat}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-gray-500 dark:text-zinc-400">Shout</dt>
                          <dd>{displayed.shout}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-gray-500 dark:text-zinc-400">Uses</dt>
                          <dd>{displayed.uses.replace(/_/g, ' ')}</dd>
                        </div>
                        {Object.keys(displayed.resist_levels).length > 0 && (
                          <div className="flex justify-between">
                            <dt className="text-gray-500 dark:text-zinc-400">Resistances</dt>
                            <dd>
                              {Object.entries(displayed.resist_levels)
                                .map(([k, v]) => `${k}:${v}`)
                                .join(', ')}
                            </dd>
                          </div>
                        )}
                      </dl>
                    </div>

                    {displayed.attacks && displayed.attacks.length > 0 && (
                      <div className="rounded border border-gray-200 p-3 dark:border-zinc-700">
                        <div className="text-xs font-medium text-gray-500 dark:text-zinc-400">
                          Attacks
                        </div>
                        <ul className="mt-1 space-y-1 text-sm">
                          {displayed.attacks.map((atk, i) => (
                            <li key={i}>
                              {atk.damage.num}d{atk.damage.size} {atk.type}
                              {atk.flavour ? ` (${atk.flavour})` : ''}
                              {atk.special ? ` [${atk.special}]` : ''}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="space-y-3">
                      <InfoSection title="Resistances" items={displayed.resistances} />
                      <InfoSection title="Vulnerabilities" items={displayed.vulnerabilities} />
                      <InfoSection title="Flags" items={displayed.flags} />
                      <InfoSection title="Defenses" items={displayed.defenses} />

                      {displayed.spells.length > 0 && (
                        <div className="rounded border border-gray-200 p-3 dark:border-zinc-700">
                          <div className="text-xs font-medium text-gray-500 dark:text-zinc-400">
                            Spells
                          </div>
                          <div className="mt-1">
                            <TagList
                              items={displayed.spells.map((s) => {
                                let str = s.name
                                if (s.damage) str += ` (${s.damage})`
                                if (s.range) str += ` [${s.range}]`
                                return str
                              })}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </Drawer.Content>
            </Drawer.Popup>
          </Drawer.Viewport>
        </Drawer.Portal>
      </Drawer.Root>
    </>
  )
}

function TileImage({
  tilePath,
  symbol,
  size,
  className,
}: {
  tilePath?: string
  symbol: string
  size: number
  className?: string
}) {
  const [failed, setFailed] = useState(false)
  const src = getTileUrl(tilePath)

  if (!src || failed) {
    return <SymbolGlyph symbol={symbol} size={size} className={className} />
  }

  return (
    <img
      src={src}
      alt={symbol}
      loading="lazy"
      width={size}
      height={size}
      className={cn('rounded object-contain', className)}
      onError={() => setFailed(true)}
    />
  )
}

function SymbolGlyph({
  symbol,
  size,
  className,
}: {
  symbol: string
  size: number
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex items-center justify-center rounded bg-gray-100 dark:bg-zinc-800',
        className,
      )}
      style={{ width: size, height: size, fontSize: size * 0.6 }}
    >
      {symbol}
    </div>
  )
}

function TagList({ items }: { items?: string[] }) {
  if (!items || items.length === 0) {
    return <span className="text-gray-400 dark:text-zinc-600">-</span>
  }

  return (
    <div className="flex flex-wrap gap-1">
      {items.map((item) => (
        <span key={item} className="rounded bg-gray-100 px-1.5 py-0.5 text-xs dark:bg-zinc-800">
          {item}
        </span>
      ))}
    </div>
  )
}

function InfoSection({ title, items }: { title: string; items?: string[] }) {
  if (!items || items.length === 0) return null

  return (
    <div className="rounded border border-gray-200 p-3 dark:border-zinc-700">
      <div className="text-xs font-medium text-gray-500 dark:text-zinc-400">{title}</div>
      <div className="mt-1 flex flex-wrap gap-1">
        <TagList items={items} />
      </div>
    </div>
  )
}

function SortTh({
  label,
  sortKey,
  active,
  dir,
  onSort,
  className,
}: {
  label: string
  sortKey: string
  active: string
  dir: 'asc' | 'desc'
  onSort: (key: string) => void
  className?: string
}) {
  const isActive = active === sortKey
  return (
    <th
      className={cn(
        'cursor-pointer px-2 py-2 select-none hover:text-gray-700 dark:hover:text-zinc-300',
        className,
      )}
      onClick={() => onSort(sortKey)}
    >
      <span className="inline-flex items-center gap-0.5">
        {label}
        {isActive &&
          (dir === 'asc' ? (
            <ChevronUpIcon className="h-3 w-3" />
          ) : (
            <ChevronDownIcon className="h-3 w-3" />
          ))}
      </span>
    </th>
  )
}
