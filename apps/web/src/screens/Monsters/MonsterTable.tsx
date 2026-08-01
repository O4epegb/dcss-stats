'use client'

import { Drawer } from '@base-ui/react/drawer'
import type { MonsterData } from '@dcss-stats/extractor/monsterCatalog'
import { ChevronDownIcon, ChevronUpIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { useLocalStorageValue, useMediaQuery } from '@react-hookz/web'
import { orderBy } from 'lodash-es'
import Image from 'next/image'
import { useMemo, useState } from 'react'
import { cn, pluralize } from '~/utils'

function getTileUrl(tilePath: string | undefined, crawlCommit: string | undefined): string | null {
  if (!tilePath) return null
  return `https://raw.githubusercontent.com/crawl/crawl/${crawlCommit ?? 'master'}/crawl-ref/source/rltiles/${tilePath}`
}

// Crawl's 16 terminal colours (see colour.cc), tuned for legibility on the dark glyph tile
const GLYPH_COLOURS: Record<string, string> = {
  black: '#555555',
  blue: '#4162e0',
  green: '#00aa00',
  cyan: '#00aaaa',
  red: '#d43d3d',
  magenta: '#b839b8',
  brown: '#aa5500',
  lightgrey: '#aaaaaa',
  darkgrey: '#777777',
  lightblue: '#5555ff',
  lightgreen: '#55ff55',
  lightcyan: '#55ffff',
  lightred: '#ff5555',
  lightmagenta: '#ff55ff',
  yellow: '#ffff55',
  white: '#ffffff',
}

function numValue(v: unknown): number | null {
  if (typeof v === 'number') return v
  if (typeof v === 'string') {
    const m = v.match(/\d+/)
    return m ? Number(m[0]) : null
  }
  return null
}

function formatLocations(locations: MonsterData['locations']): string[] {
  if (!locations || locations.length === 0) return []

  // A monster can have several table entries per branch; merge them into one range
  const merged = new Map<
    string,
    { abbrev: string; min: number; max: number; depth: number; habitat?: string }
  >()
  for (const loc of locations) {
    const key = `${loc.branchAbbrev}|${loc.habitat ?? ''}`
    const cur = merged.get(key)
    if (cur) {
      cur.min = Math.min(cur.min, loc.minDepth)
      cur.max = Math.max(cur.max, loc.maxDepth)
    } else {
      merged.set(key, {
        abbrev: loc.branchAbbrev,
        min: loc.minDepth,
        max: loc.maxDepth,
        depth: loc.branchDepth,
        habitat: loc.habitat,
      })
    }
  }

  return [...merged.values()].map((l) => {
    let label = l.abbrev
    if (!(l.min === 1 && l.max === l.depth)) {
      label += l.min === l.max ? `:${l.min}` : `:${l.min}–${l.max}`
    }
    if (l.habitat) label += ` (${l.habitat})`
    return label
  })
}

function formatSpells(spells: MonsterData['spells']): string[] {
  // freq is a relative weight crawl uses to pick which spell to cast;
  // show it as each spell's share of casts
  const totalFreq = spells.reduce((sum, s) => sum + (s.freq ?? 0), 0)

  return spells.map((s) => {
    let str = s.name
    if (s.damage) str += ` (${s.damage})`
    if (s.range) str += ` [${s.range}]`
    if (s.freq && totalFreq > 0) str += ` · ${Math.round((s.freq / totalFreq) * 100)}%`
    return str
  })
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

export function MonsterTable({
  monsters,
  crawlCommit,
}: {
  monsters: MonsterData[]
  crawlCommit?: string
}) {
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
          className="border-border bg-surface placeholder:text-muted-foreground focus:border-accent w-full rounded border px-3 py-2 text-sm outline-none"
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className="flex items-center justify-between gap-3">
          <div className="text-muted-foreground text-xs">
            {filtered.length} {pluralize('monster', filtered.length)}
          </div>
          <button
            type="button"
            className="text-muted-foreground hover:bg-surface-hover flex items-center gap-1.5 rounded px-2 py-1 text-xs transition-colors"
            onClick={() => showTiles.set(!showTiles.value)}
          >
            <span
              className={cn(
                'relative inline-flex h-4 w-7 shrink-0 rounded-full transition-colors',
                showTiles.value ? 'bg-accent' : 'bg-surface-active',
              )}
            >
              <span
                className={cn(
                  'bg-control-thumb pointer-events-none mt-0.5 inline-block h-3 w-3 translate-x-0.5 rounded-full shadow transition-transform',
                  showTiles.value && 'translate-x-3.5',
                )}
              />
            </span>
            Tiles
          </button>
        </div>

        {filtered.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <Image
              width={32}
              height={32}
              src="/unseen_horror.png"
              alt=""
              className="pixelated size-12"
            />
            <div>
              <p className="text-sm font-medium">No monsters found</p>
              <p className="text-muted-foreground mt-1 text-xs italic">
                You sense the presence of something unfriendly..
              </p>
            </div>
          </div>
        )}

        <div className={cn('overflow-x-auto', filtered.length === 0 && 'hidden')}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-border text-muted-foreground border-b text-left text-xs font-medium">
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
                    'border-border hover:bg-surface-hover/60 cursor-pointer border-b transition-colors',
                    selected?.id === monster.id && 'bg-success-surface',
                  )}
                  onClick={() => select(selected?.id === monster.id ? null : monster)}
                >
                  <td className="shrink-0 py-2 pr-2">
                    <div className="relative w-10">
                      {showTiles.value ? (
                        <TileImage
                          tilePath={monster.tile_path}
                          crawlCommit={crawlCommit}
                          symbol={monster.symbol}
                          colour={monster.colour}
                          size={32}
                          className="h-8 w-8"
                        />
                      ) : (
                        <SymbolGlyph symbol={monster.symbol} colour={monster.colour} size={32} />
                      )}
                      <span className="bg-surface-active text-muted-foreground absolute -right-0.5 -bottom-0.5 rounded-sm px-0.5 text-[9px] leading-3 font-medium md:hidden">
                        {monster.symbol}
                      </span>
                    </div>
                  </td>
                  <td className="px-2 py-2 font-medium">
                    {monster.name}
                    {monster.unfinished && (
                      <span className="text-warning ml-1 text-xs">(unfinished)</span>
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
            <Drawer.Backdrop className="bg-overlay fixed inset-0 min-h-dvh transition-opacity duration-450 ease-[cubic-bezier(0.32,0.72,0,1)] data-ending-style:opacity-0 data-ending-style:duration-[calc(var(--drawer-swipe-strength)*400ms)] data-starting-style:opacity-0 data-swiping:duration-0 supports-[-webkit-touch-callout:none]:absolute" />
          )}
          <Drawer.Viewport
            className={cn(
              'pointer-events-none fixed inset-0 flex p-0',
              'items-end justify-center md:items-stretch md:justify-end',
            )}
          >
            <Drawer.Popup
              className={cn(
                'bg-surface text-foreground outline-border pointer-events-auto overflow-y-auto outline-1',
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
              {isMobile && <div className="bg-surface-active mx-auto mb-3 h-1 w-12 rounded-full" />}
              <Drawer.Content className="relative">
                <Drawer.Close className="text-muted-foreground hover:bg-surface-hover hover:text-foreground absolute top-0 right-0 rounded p-1">
                  <XMarkIcon className="size-6" />
                </Drawer.Close>

                {displayed && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      {showTiles.value ? (
                        <TileImage
                          tilePath={displayed.tile_path}
                          crawlCommit={crawlCommit}
                          symbol={displayed.symbol}
                          colour={displayed.colour}
                          size={64}
                          className="h-16 w-16"
                        />
                      ) : (
                        <SymbolGlyph
                          symbol={displayed.symbol}
                          colour={displayed.colour}
                          size={64}
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate pr-8 text-base font-semibold">{displayed.name}</h3>
                        <div className="text-muted-foreground text-xs">
                          {/* hidden for now, redundant */}
                          {/* {displayed.symbol} &middot; {displayed.size} &middot;{' '}
                          {displayed.intelligence} */}
                        </div>
                      </div>
                    </div>

                    {displayed.description && (
                      <p className="text-muted-foreground text-xs leading-relaxed">
                        {displayed.description.split('\n\n')[0]}
                      </p>
                    )}

                    <InfoSection title="Found in" items={formatLocations(displayed.locations)} />

                    <div className="border-border rounded border p-3">
                      <div className="text-muted-foreground text-xs font-medium">Stats</div>
                      <dl className="mt-1 space-y-1 text-sm">
                        <div className="flex justify-between">
                          <dt className="text-muted-foreground">HD</dt>
                          <dd>{displayed.hd ?? '-'}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-muted-foreground">HP</dt>
                          <dd>{displayed.hp}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-muted-foreground">AC</dt>
                          <dd>
                            {displayed.ac ?? '-'}
                            {displayed.ac_sim != null && displayed.ac_sim !== displayed.ac && (
                              <span className="text-muted-foreground ml-1">
                                ({displayed.ac_sim})
                              </span>
                            )}
                          </dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-muted-foreground">EV</dt>
                          <dd>
                            {displayed.ev ?? '-'}
                            {displayed.ev_sim != null && displayed.ev_sim !== displayed.ev && (
                              <span className="text-muted-foreground ml-1">
                                ({displayed.ev_sim})
                              </span>
                            )}
                          </dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-muted-foreground">Speed</dt>
                          <dd>{formatSpeed(displayed.speed)}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-muted-foreground">Size</dt>
                          <dd>{displayed.size}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-muted-foreground">Intelligence</dt>
                          <dd>{displayed.intelligence}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-muted-foreground">XP</dt>
                          <dd>{displayed.xp ?? '-'}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-muted-foreground">Willpower</dt>
                          <dd>
                            {displayed.willpower_invuln
                              ? '∞'
                              : displayed.willpower
                                ? displayed.willpower
                                : '-'}
                          </dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-muted-foreground">Spell HD</dt>
                          <dd>{displayed.spell_hd}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-muted-foreground">Species</dt>
                          <dd>{displayed.species}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-muted-foreground">Genus</dt>
                          <dd>{displayed.genus}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-muted-foreground">Corpse</dt>
                          <dd>{displayed.corpse ? 'Yes' : 'No'}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-muted-foreground">Shape</dt>
                          <dd>{displayed.shape}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-muted-foreground">Holiness</dt>
                          <dd>{displayed.holiness || '-'}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-muted-foreground">Habitat</dt>
                          <dd>{displayed.habitat}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-muted-foreground">Shout</dt>
                          <dd>{displayed.shout}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-muted-foreground">Uses</dt>
                          <dd>{displayed.uses.replace(/_/g, ' ')}</dd>
                        </div>
                        {Object.keys(displayed.resist_levels).length > 0 && (
                          <div className="flex justify-between">
                            <dt className="text-muted-foreground">Resistances</dt>
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
                      <div className="border-border rounded border p-3">
                        <div className="text-muted-foreground text-xs font-medium">Attacks</div>
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
                        <div className="border-border rounded border p-3">
                          <div className="text-muted-foreground text-xs font-medium">Spells</div>
                          <div className="mt-1">
                            <TagList items={formatSpells(displayed.spells)} />
                          </div>
                        </div>
                      )}
                    </div>

                    {displayed.quote && (
                      <blockquote className="border-border text-muted-foreground border-l-2 pl-2 text-xs leading-relaxed whitespace-pre-line italic">
                        {displayed.quote.split('\n\n')[0]}
                      </blockquote>
                    )}
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
  crawlCommit,
  symbol,
  colour,
  size,
  className,
}: {
  tilePath?: string
  crawlCommit?: string
  symbol: string
  colour?: string
  size: number
  className?: string
}) {
  const [failed, setFailed] = useState(false)
  const src = getTileUrl(tilePath, crawlCommit)

  if (!src || failed) {
    return <SymbolGlyph symbol={symbol} colour={colour} size={size} className={className} />
  }

  return (
    <img
      src={src}
      alt={symbol}
      loading="lazy"
      width={size}
      height={size}
      className={cn('pixelated rounded object-contain', className)}
      onError={() => setFailed(true)}
    />
  )
}

function SymbolGlyph({
  symbol,
  colour,
  size,
  className,
}: {
  symbol: string
  colour?: string
  size: number
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex items-center justify-center rounded font-mono',
        colour ? 'bg-glyph-background' : 'bg-surface-emphasis',
        className,
      )}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.6,
        color: colour ? GLYPH_COLOURS[colour] : undefined,
      }}
    >
      {symbol}
    </div>
  )
}

function TagList({ items }: { items?: string[] }) {
  if (!items || items.length === 0) {
    return <span className="text-muted-foreground/60">-</span>
  }

  return (
    <div className="flex flex-wrap gap-1">
      {items.map((item) => (
        <span key={item} className="bg-surface-emphasis rounded px-1.5 py-0.5 text-xs">
          {item}
        </span>
      ))}
    </div>
  )
}

function InfoSection({ title, items }: { title: string; items?: string[] }) {
  if (!items || items.length === 0) return null

  return (
    <div className="border-border rounded border p-3">
      <div className="text-muted-foreground text-xs font-medium">{title}</div>
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
      className={cn('hover:text-foreground cursor-pointer px-2 py-2 select-none', className)}
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
