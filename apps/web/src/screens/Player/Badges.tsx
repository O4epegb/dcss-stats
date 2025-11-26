import { Tooltip } from '~/components/ui/Tooltip'
import { cn } from '~/utils'
import { TooltipTable } from './TooltipTable'
import { usePlayerPageContext } from './context'

export const Badges = () => {
  const { summary, gods, tiamat, streaks } = usePlayerPageContext()

  const { isGreat, isGrand, isGreater, isPolytheist, isTiamat } = summary

  const topStreak = streaks.inTop100[0]

  return (
    <div className="flex flex-wrap gap-2 text-sm">
      {isGreater ? (
        <Tooltip content={<div>Has won with all races and all classes</div>}>
          <div className="rounded bg-amber-300 px-1 py-0.5 text-black ring-2 ring-amber-600 ring-inset">
            Greater Player
          </div>
        </Tooltip>
      ) : (
        <>
          {isGreat && (
            <Tooltip content="Has won with all races">
              <div className="rounded bg-amber-300 px-1 py-0.5 text-black">Great Player</div>
            </Tooltip>
          )}
          {isGrand && (
            <Tooltip content="Has won with all classes">
              <div className="rounded bg-amber-300 px-1 py-0.5 text-black">Grand Player</div>
            </Tooltip>
          )}
        </>
      )}
      {isPolytheist && (
        <Tooltip interactive content={<TooltipTable title="Has won with all gods:" data={gods} />}>
          <div className="rounded bg-sky-300 px-1 py-0.5 text-black">Polytheist</div>
        </Tooltip>
      )}
      {isTiamat && (
        <Tooltip
          interactive
          content={
            <TooltipTable title="Has won with every Draconian color:" data={tiamat.detailed} />
          }
        >
          <div className="rounded bg-purple-300 px-1 py-0.5 text-black">Tiamat</div>
        </Tooltip>
      )}
      {streaks.inTop100.length > 0 && (
        <Tooltip
          interactive
          content={
            <div>
              <div>Streaks in Top 100:</div>
              <ul className="mt-2 list-disc pl-4">
                {streaks.inTop100.map((streak) => (
                  <li key={streak.rank}>
                    Rank #{streak.rank} - {streak.length} games -{' '}
                    {streak.isBroken ? 'Broken' : 'Ongoing'} ({streak.type})
                  </li>
                ))}
              </ul>
            </div>
          }
        >
          <div
            className={cn('rounded px-1 py-0.5 text-black ring-2 ring-inset', {
              'bg-amber-300 ring-orange-600': topStreak?.rank === 1,
              'bg-slate-300 ring-slate-500': topStreak?.rank === 2,
              'bg-amber-600 text-white ring-amber-800': topStreak?.rank === 3,
              'bg-emerald-400 ring-emerald-600': topStreak?.rank > 3 && topStreak?.rank <= 10,
              'bg-emerald-300 ring-emerald-500': topStreak?.rank > 10 && topStreak?.rank <= 25,
              'bg-emerald-200 ring-emerald-400': topStreak?.rank > 25 && topStreak?.rank <= 50,
              'bg-emerald-100 ring-emerald-300': topStreak?.rank > 50,
            })}
          >
            Top {topStreak?.rank} Streak
          </div>
        </Tooltip>
      )}
    </div>
  )
}
