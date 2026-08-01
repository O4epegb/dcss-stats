import { cn, formatNumber } from '~/utils'

export const WinrateStats = ({
  games,
  wins,
  small,
  className,
}: {
  games: number
  wins: number
  small?: boolean
  className?: string
}) => {
  return (
    <div className={cn('flex font-bold', small ? 'space-x-1' : 'space-x-4 text-xl', className)}>
      <div className="text-stat-wins whitespace-nowrap">{formatNumber(wins)}W</div>
      <div className="text-stat-games whitespace-nowrap">{formatNumber(games)}G</div>
      <div className="text-stat-winrate whitespace-nowrap">
        {formatNumber((wins / games || 0) * 100, {
          maximumFractionDigits: 2,
        })}
        % WR
      </div>
    </div>
  )
}
