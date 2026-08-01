import { Tooltip } from '~/components/ui/Tooltip'
import { cn, formatDuration, formatNumber } from '~/utils'
import { usePlayerPageContext } from './context'
import { LeaderboardBadge } from './LeaderboardBadge'
import { TooltipTable } from './TooltipTable'

const HIGHSCORE_LABELS = { TIER_1: '3 Rune', TIER_2: '4+ Rune' }
const MULTI_RUNE_LABELS = { TIER_1: '3-14 Rune', TIER_2: '15 Rune' }

export const Badges = () => {
  const { summary, gods, tiamat, streaks, highscores, player } = usePlayerPageContext()

  const { isGreat, isGrand, isGreater, isPolytheist, isTiamat } = summary

  const topStreak = streaks.inTop100[0]

  return (
    <section className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm empty:hidden">
      {isGreater ? (
        <Tooltip content={<div>Has won with all races and all classes</div>}>
          <div className="badge-achievement-major rounded px-1 py-0.5 ring-2 ring-inset">
            Greater Player
          </div>
        </Tooltip>
      ) : (
        <>
          {isGreat && (
            <Tooltip content="Has won with all races">
              <div className="badge-achievement rounded px-1 py-0.5">Great Player</div>
            </Tooltip>
          )}
          {isGrand && (
            <Tooltip content="Has won with all classes">
              <div className="badge-achievement rounded px-1 py-0.5">Grand Player</div>
            </Tooltip>
          )}
        </>
      )}
      {isPolytheist && (
        <Tooltip interactive content={<TooltipTable title="Has won with all gods:" data={gods} />}>
          <div className="badge-polytheist rounded px-1 py-0.5">Polytheist</div>
        </Tooltip>
      )}
      {isTiamat && (
        <Tooltip
          interactive
          content={
            <TooltipTable title="Has won with every Draconian color:" data={tiamat.detailed} />
          }
        >
          <div className="badge-tiamat rounded px-1 py-0.5">Tiamat</div>
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
            className={cn('rounded px-1 py-0.5 ring-2 ring-inset', {
              'rank-first': topStreak?.rank === 1,
              'rank-second': topStreak?.rank === 2,
              'rank-third': topStreak?.rank === 3,
              'rank-elite-10': topStreak?.rank > 3 && topStreak?.rank <= 10,
              'rank-elite-25': topStreak?.rank > 10 && topStreak?.rank <= 25,
              'rank-elite-50': topStreak?.rank > 25 && topStreak?.rank <= 50,
              'rank-elite-100': topStreak?.rank > 50,
            })}
          >
            Top {topStreak?.rank} Streak
          </div>
        </Tooltip>
      )}
      <LeaderboardBadge
        label="Highscorer"
        data={highscores.score}
        playerId={player.id}
        kind="HIGHSCORE"
        category="score"
        runeTierLabels={HIGHSCORE_LABELS}
        valueLabel={(e) => formatNumber(e.score)}
      />
      <LeaderboardBadge
        label="Turncounter"
        data={highscores.turncount}
        playerId={player.id}
        kind="TURN_COUNT"
        category="turncount"
        runeTierLabels={MULTI_RUNE_LABELS}
        valueLabel={(e) => formatNumber(e.turns) + ' turns'}
      />
      <LeaderboardBadge
        label="Speedrunner"
        data={highscores.duration}
        playerId={player.id}
        kind="DURATION"
        category="duration"
        runeTierLabels={MULTI_RUNE_LABELS}
        valueLabel={(e) => formatDuration(e.duration)}
      />
    </section>
  )
}
