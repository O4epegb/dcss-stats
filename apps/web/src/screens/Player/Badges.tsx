import Link from 'next/link'
import { Tooltip } from '~/components/ui/Tooltip'
import { cn } from '~/utils'
import { TooltipTable } from './TooltipTable'
import { usePlayerPageContext } from './context'

export const Badges = () => {
  const { summary, gods, tiamat, streaks, highscores, player } = usePlayerPageContext()

  const { isGreat, isGrand, isGreater, isPolytheist, isTiamat } = summary

  const topStreak = streaks.inTop100[0]

  const runeTierLabels: Record<string, string> = {
    ALL: 'All',
    THREE_RUNES: '3 Rune',
    FOUR_PLUS_RUNES: '4+ Rune',
  }

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
      {highscores.rank != null &&
        (() => {
          const points = highscores.data.reduce((sum, e) => sum + (11 - e.rank), 0)
          const remaining = highscores.total - highscores.data.length

          return (
            <Tooltip
              interactive
              content={
                <div>
                  <div>Highscore Leaderboard ({points} pts):</div>
                  <ul className="mt-2 list-disc pl-4">
                    {highscores.data.map((entry, i) => (
                      <li key={i}>
                        #{entry.rank} {entry.char} ({runeTierLabels[entry.runeTier]}) —{' '}
                        {entry.score.toLocaleString()} (+{11 - entry.rank} pts)
                      </li>
                    ))}
                  </ul>
                  {remaining > 0 && (
                    <div className="mt-1 text-right">
                      <Link
                        prefetch={false}
                        className="underline"
                        href={{
                          pathname: '/highscores',
                          query: { player: player.id },
                        }}
                      >
                        +{remaining} more {remaining === 1 ? 'entry' : 'entries'}
                      </Link>
                    </div>
                  )}
                  <div className="mt-1 text-gray-400">
                    Each placement for each combo earns points:
                    <br /> 1st place 10 points
                    <br /> 2nd place 9 points
                    <br /> and so on down to 10th place.
                  </div>
                </div>
              }
            >
              <div
                className={cn('rounded px-1 py-0.5 text-black ring-2 ring-inset', {
                  'bg-amber-300 ring-orange-600': highscores.rank === 1,
                  'bg-slate-300 ring-slate-500': highscores.rank === 2,
                  'bg-amber-600 text-white ring-amber-800': highscores.rank === 3,
                  'bg-teal-400 ring-teal-600': highscores.rank > 3 && highscores.rank <= 10,
                  'bg-teal-300 ring-teal-500': highscores.rank > 10 && highscores.rank <= 25,
                  'bg-teal-200 ring-teal-400': highscores.rank > 25 && highscores.rank <= 50,
                  'bg-teal-100 ring-teal-300': highscores.rank > 50 && highscores.rank <= 100,
                  'bg-teal-100 ring-0': highscores.rank > 100,
                })}
              >
                Top {highscores.rank} Highscorer
              </div>
            </Tooltip>
          )
        })()}
    </div>
  )
}
