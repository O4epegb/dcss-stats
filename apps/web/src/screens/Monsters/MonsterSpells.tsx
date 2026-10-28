'use client'

import type { MonsterData } from '@dcss-stats/extractor/monsterCatalog'
import { ChevronDownIcon, InformationCircleIcon } from '@heroicons/react/24/outline'
import { Tooltip } from '~/components/ui/Tooltip'
import { cn } from '~/utils'

type MonsterSpell = MonsterData['spells'][number]

function SpellSusceptibility({
  affected,
  type,
}: {
  affected: boolean
  type: 'Silence' | 'Antimagic'
}) {
  const explanation =
    type === 'Silence'
      ? affected
        ? 'Silence prevents this spell from being cast.'
        : 'This ability can be used while silenced.'
      : affected
        ? 'Antimagic can cause this spell to fail.'
        : 'Antimagic does not disrupt this ability.'

  return (
    <Tooltip trigger="click" content={<div className="max-w-64">{explanation}</div>}>
      <button
        type="button"
        className={cn(
          'bg-surface-emphasis hover:bg-surface-active rounded px-2 py-1 text-xs',
          'focus-visible:outline-focus-ring focus-visible:outline-2 focus-visible:outline-offset-2',
          'pointer-coarse:min-h-11',
          !affected && 'text-muted-foreground',
        )}
      >
        {type}: {affected ? 'yes' : 'no'}
      </button>
    </Tooltip>
  )
}

function SpellRow({ spell, totalWeight }: { spell: MonsterSpell; totalWeight: number }) {
  if (spell.name === '(random)') {
    return (
      <div className="space-y-1 p-3">
        <div className="text-sm font-medium">Random spells</div>
        <p className="text-muted-foreground text-xs">The spell set varies between individuals.</p>
      </div>
    )
  }

  const weight =
    spell.freq && totalWeight > 0 ? Math.round((spell.freq / totalWeight) * 100) : undefined

  return (
    <details className="group">
      <summary
        className={cn(
          'hover:bg-surface-hover cursor-pointer list-none p-3 [&::-webkit-details-marker]:hidden',
          'focus-visible:outline-focus-ring focus-visible:outline-2 focus-visible:-outline-offset-2',
        )}
      >
        <span className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium">{spell.name}</span>
          <span className="text-muted-foreground flex shrink-0 items-center gap-2">
            {weight !== undefined && (
              <span
                className="text-xs tabular-nums"
                aria-label={`Relative cast weight: ${weight}%`}
              >
                {weight}%
              </span>
            )}
            <ChevronDownIcon aria-hidden className="size-3.5 group-open:rotate-180" />
          </span>
        </span>
        {(spell.damage || (spell.range != null && spell.range > 0)) && (
          <span className="text-muted-foreground mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs">
            {spell.damage && (
              <span>
                Effect <span className="text-foreground tabular-nums">{spell.damage}</span>
              </span>
            )}
            {spell.range != null && spell.range > 0 && (
              <span>
                Range <span className="text-foreground tabular-nums">{spell.range}</span>
              </span>
            )}
          </span>
        )}
        {(spell.breath || spell.critical) && (
          <span className="mt-1.5 flex flex-wrap gap-1">
            {spell.breath && (
              <span className="bg-warning-surface text-warning-foreground rounded px-1.5 py-0.5 text-xs">
                Breath
              </span>
            )}
            {spell.critical && (
              <span className="bg-warning-surface text-warning-foreground rounded px-1.5 py-0.5 text-xs">
                Emergency
              </span>
            )}
          </span>
        )}
      </summary>
      <div className="space-y-2 px-3 pb-3 text-xs">
        {spell.breath && (
          <p className="text-muted-foreground">Requires time to recharge after use.</p>
        )}
        {spell.critical && (
          <p className="text-muted-foreground">Used only in emergency situations.</p>
        )}
        <div>
          <div className="text-muted-foreground mb-1.5">Affected by</div>
          <div className="flex flex-wrap gap-1.5">
            <SpellSusceptibility type="Silence" affected={Boolean(spell.silence)} />
            <SpellSusceptibility type="Antimagic" affected={Boolean(spell.antimagic)} />
          </div>
        </div>
      </div>
    </details>
  )
}

export function MonsterSpells({ spells }: { spells: MonsterData['spells'] }) {
  const totalWeight = spells.reduce((sum, spell) => sum + (spell.freq ?? 0), 0)
  const hasRandomSpells = spells.some((spell) => spell.name === '(random)')

  return (
    <section aria-label="Spells" className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-muted-foreground text-xs font-medium">
          Spells {!hasRandomSpells && <span className="ml-1 font-normal">{spells.length}</span>}
        </h4>
        {totalWeight > 0 && (
          <Tooltip
            trigger="click"
            content={
              <div className="max-w-64">
                Relative spell-selection weights. Actual use depends on available spells and the
                situation; these are not chances to cast each turn.
              </div>
            }
          >
            <button
              type="button"
              className={cn(
                'text-muted-foreground hover:text-foreground flex items-center gap-1 rounded py-1 text-xs',
                'focus-visible:outline-focus-ring focus-visible:outline-2 focus-visible:outline-offset-2',
                'pointer-coarse:min-h-11',
              )}
            >
              Cast weight <InformationCircleIcon aria-hidden className="size-3.5" />
            </button>
          </Tooltip>
        )}
      </div>
      <div className="border-border divide-border divide-y overflow-hidden rounded border">
        {spells.map((spell) => (
          <SpellRow key={spell.name} spell={spell} totalWeight={totalWeight} />
        ))}
      </div>
    </section>
  )
}
