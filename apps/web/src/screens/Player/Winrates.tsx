import { WinrateStats } from '~/components/WinrateStats'
import { pluralize, formatNumber } from '~/utils'
import { usePlayerPageContext } from './context'

export const Winrates = () => {
  const { stats } = usePlayerPageContext()

  return (
    <section>
      <WinrateStats wins={stats.total.wins} games={stats.total.games} />
      <div className="text-xs">
        {stats.lastMonth.total} {pluralize('game', stats.lastMonth.total)} and{' '}
        {stats.lastMonth.wins} {pluralize('win', stats.lastMonth.wins)}{' '}
        {stats.lastMonth.wins > 0 && (
          <>
            (
            {formatNumber((stats.lastMonth.wins / (stats.lastMonth.total || 1)) * 100, {
              maximumFractionDigits: 2,
            })}
            %){' '}
          </>
        )}
        in the last 30 days
      </div>
    </section>
  )
}
