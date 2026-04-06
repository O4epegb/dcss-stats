import Link from 'next/link'
import { Tooltip } from '~/components/ui/Tooltip'
import { HighscoreBreakdown, HighscoreKind, HighscoreRuneTier } from '~/types'
import { cn } from '~/utils'

type Entry = {
  breakdown: HighscoreBreakdown
  runeTier: HighscoreRuneTier
  rank: number
  char: string
  score: number
  turns: number
  duration: number
  points: number
}

type LeaderboardData = {
  data: Entry[]
  total: number
  points: number
  rank: number | null
}

type ColorKey = 'teal' | 'cyan' | 'violet'

interface LeaderboardBadgeProps {
  label: string
  data: LeaderboardData
  playerId: string
  kind: HighscoreKind
  color: ColorKey
  runeTierLabels: Record<string, string>
  valueLabel: (entry: Entry) => string
  pointsDescription?: string
}

const colorMap: Record<ColorKey, Record<string, string>> = {
  teal: {
    '4': 'bg-teal-400 ring-teal-600',
    '10': 'bg-teal-300 ring-teal-500',
    '25': 'bg-teal-200 ring-teal-400',
    '100': 'bg-teal-100 ring-teal-300',
    default: 'bg-teal-100 ring-0',
  },
  cyan: {
    '4': 'bg-cyan-400 ring-cyan-600',
    '10': 'bg-cyan-300 ring-cyan-500',
    '25': 'bg-cyan-200 ring-cyan-400',
    '100': 'bg-cyan-100 ring-cyan-300',
    default: 'bg-cyan-100 ring-0',
  },
  violet: {
    '4': 'bg-violet-400 ring-violet-600',
    '10': 'bg-violet-300 ring-violet-500',
    '25': 'bg-violet-200 ring-violet-400',
    '100': 'bg-violet-100 ring-violet-300',
    default: 'bg-violet-100 ring-0',
  },
}

function getRankColor(rank: number, color: ColorKey) {
  if (rank === 1) return 'bg-amber-300 ring-orange-600'
  if (rank === 2) return 'bg-slate-300 ring-slate-500'
  if (rank === 3) return 'bg-amber-600 text-white ring-amber-800'

  const colors = colorMap[color]
  if (rank <= 4) return colors['4']
  if (rank <= 10) return colors['10']
  if (rank <= 25) return colors['25']
  if (rank <= 100) return colors['100']
  return colors.default
}

export const LeaderboardBadge = ({
  label,
  data,
  playerId,
  kind,
  color,
  runeTierLabels,
  valueLabel,
  pointsDescription,
}: LeaderboardBadgeProps) => {
  if (data.rank == null) return null

  const remaining = data.total - data.data.length

  return (
    <Tooltip
      interactive
      content={
        <div>
          <div>
            {label} Leaderboard ({data.points} pts):
          </div>
          <ul className="mt-2 list-disc pl-4">
            {data.data.map((entry, i) => (
              <li key={i}>
                #{entry.rank} {entry.char} ({runeTierLabels[entry.runeTier]}) — {valueLabel(entry)}{' '}
                (+{entry.points} pts)
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
                  query: { player: playerId, kind },
                }}
              >
                +{remaining} more {remaining === 1 ? 'entry' : 'entries'}
              </Link>
            </div>
          )}
          {pointsDescription && <div className="mt-1 text-gray-400">{pointsDescription}</div>}
        </div>
      }
    >
      <div
        className={cn(
          'rounded px-1 py-0.5 text-black ring-2 ring-inset',
          getRankColor(data.rank, color),
        )}
      >
        Top {data.rank} {label}
      </div>
    </Tooltip>
  )
}
