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
      <div className="whitespace-nowrap text-emerald-600 dark:text-emerald-400">
        {formatNumber(wins)}W
      </div>
      <div className="whitespace-nowrap text-blue-600 dark:text-blue-400">
        {formatNumber(games)}G
      </div>
      <div className="whitespace-nowrap text-pink-600 dark:text-pink-400">
        {formatNumber((wins / games || 0) * 100, {
          maximumFractionDigits: 2,
        })}
        % WR
      </div>
    </div>
  )
}
