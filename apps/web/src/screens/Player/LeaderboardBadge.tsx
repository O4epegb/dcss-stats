import Link from 'next/link'
import { Tooltip } from '~/components/ui/Tooltip'
import { HighscoreKind, PlayerLeaderboard, PlayerLeaderboardEntry } from '~/types'
import { cn } from '~/utils'

type LeaderboardCategory = 'score' | 'turncount' | 'duration'

interface LeaderboardBadgeProps {
  label: string
  data: PlayerLeaderboard
  playerId: string
  kind: HighscoreKind
  category: LeaderboardCategory
  runeTierLabels: Record<string, string>
  valueLabel: (entry: PlayerLeaderboardEntry) => string
  pointsDescription?: string
}

const categoryClassNames: Record<LeaderboardCategory, string> = {
  score: 'leaderboard-score',
  turncount: 'leaderboard-turncount',
  duration: 'leaderboard-duration',
}

function getRankClassName(rank: number, category: LeaderboardCategory) {
  if (rank === 1) return 'rank-first'
  if (rank === 2) return 'rank-second'
  if (rank === 3) return 'rank-third'

  const categoryClassName = categoryClassNames[category]
  if (rank <= 4) return cn(categoryClassName, 'leaderboard-rank-4')
  if (rank <= 10) return cn(categoryClassName, 'leaderboard-rank-10')
  if (rank <= 25) return cn(categoryClassName, 'leaderboard-rank-25')
  if (rank <= 100) return cn(categoryClassName, 'leaderboard-rank-100')
  return cn(categoryClassName, 'leaderboard-rank-default ring-0')
}

export const LeaderboardBadge = ({
  label,
  data,
  playerId,
  kind,
  category,
  runeTierLabels,
  valueLabel,
  pointsDescription,
}: LeaderboardBadgeProps) => {
  if (data.rank == null) return null

  const remaining = data.tiers.reduce((sum, tier) => sum + tier.total - tier.entries.length, 0)

  return (
    <Tooltip
      interactive
      content={
        <div>
          <div>
            {label} Leaderboard ({data.points} pts):
          </div>
          {data.tiers.map((tier) => (
            <div key={tier.runeTier} className="mt-2">
              <div className="font-medium">{runeTierLabels[tier.runeTier]}:</div>
              <ul className="mt-1 list-disc pl-4">
                {tier.entries.map((entry, i) => (
                  <li key={i}>
                    #{entry.rank} {entry.char} — {valueLabel(entry)} (+{entry.points} pts)
                  </li>
                ))}
              </ul>
            </div>
          ))}
          {remaining > 0 && (
            <div className="mt-1 text-right">
              <Link
                prefetch={false}
                className="underline"
                href={{
                  pathname: '/highscores',
                  query: { player: playerId, kind },
                }}
              >
                +{remaining} more {remaining === 1 ? 'entry' : 'entries'}
              </Link>
            </div>
          )}
          {pointsDescription && (
            <div className="text-muted-foreground mt-1">{pointsDescription}</div>
          )}
        </div>
      }
    >
      <div
        className={cn(
          'rounded px-1 py-0.5 ring-2 ring-inset',
          getRankClassName(data.rank, category),
        )}
      >
        Top {data.rank} {label}
      </div>
    </Tooltip>
  )
}
