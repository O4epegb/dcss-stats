import { first, last, orderBy } from 'lodash-es'
import { useState } from 'react'
import useSWRImmutable from 'swr/immutable'
import { api } from '~/api'
import { GameTooltip } from '~/components/GameTooltip'
import { Loader } from '~/components/ui/Loader'
import { Game } from '~/types'
import { cn, date, formatNumber, pluralize } from '~/utils'
import { usePlayerPageContext } from './context'
import { List } from './Stats'

type StreakGame = Pick<Game, 'id' | 'isWin' | 'endAt' | 'char'>
type StreakGroups = Array<StreakGame[]>

export const Streaks = () => {
  const { streaks, player, filterParams } = usePlayerPageContext()
  const [isVisible, setIsVisible] = useState(false)

  const {
    data: streakGroups,
    isLoading,
    error,
  } = useSWRImmutable(
    isVisible ? [`/players/${player.id}/streaks`, filterParams] : null,
    ([url, params]) =>
      api
        .get<{ streaks: { streaks: StreakGroups } }>(url, { params })
        .then((res) => res.data.streaks.streaks),
  )

  return (
    <section className="space-y-1">
      <header className="flex items-center justify-between">
        <h2 className="font-bold">
          {streaks.total > 0 ? (
            <>
              Has {streaks.total} {pluralize('streak', streaks.total)} of wins:
            </>
          ) : (
            'Has no streaks of wins yet'
          )}
        </h2>
        {streaks.current > 0 && (
          <div className="text-success text-right text-sm">
            🔥 On streak: {streaks.current} wins in a row
          </div>
        )}
      </header>
      {streaks.total > 0 && (
        <div className="flex items-center gap-2 text-sm whitespace-nowrap">
          <div className="flex gap-4">
            <List items={[['Best', `${streaks.best} ${pluralize('win', streaks.best)}`]]} />
            <List
              items={[
                [
                  'Average',
                  `${formatNumber(streaks.average, { maximumFractionDigits: 1 })} ${pluralize(
                    'win',
                    streaks.average,
                  )}`,
                ],
              ]}
            />
          </div>
          <button
            disabled={isLoading}
            className="text-link ml-auto py-0.5 text-sm hover:underline"
            onClick={() => setIsVisible((state) => !state)}
          >
            {isVisible ? 'Hide' : 'Show'} streaks
          </button>
        </div>
      )}
      {isLoading && <Loader />}
      {error && <div className="text-danger text-sm">Error fetching data</div>}
      {isVisible && streakGroups && (
        <div className="space-y-2">
          {orderBy(
            streakGroups,
            [(streak) => last(streak)?.isWin, (streak) => streak.filter((x) => x.isWin).length],
            ['desc', 'desc'],
          ).map((streak, index) => {
            const isActive = streak.every((x) => x.isWin)
            const firstGame = first(streak)
            const lastGame = last(streak)
            const streakLength = isActive ? streak.length : streak.length - 1

            return (
              <div
                key={index}
                className={cn(
                  'border-border rounded-sm border px-2 py-1 text-sm',
                  isActive && 'border-l-success border-l-2',
                )}
              >
                {isActive && <div className="text-success">Active streak</div>}
                <div>
                  <span className="font-medium">{streakLength} wins:</span>{' '}
                  <span>
                    {streak
                      .filter((game) => game.isWin)
                      .map((game, index) => (
                        <GameTooltip key={game.id} id={game.id} player={player.name}>
                          <span>
                            {index !== 0 && ', '}
                            {game.char}
                          </span>
                        </GameTooltip>
                      ))}
                  </span>
                </div>
                {!isActive && lastGame && (
                  <div>
                    <span className="font-light">Streak breaker:</span>{' '}
                    <GameTooltip id={lastGame.id} player={player.name}>
                      <span>{lastGame.char}</span>
                    </GameTooltip>
                  </div>
                )}
                {firstGame && (
                  <div className="text-muted-foreground pt-0.5 text-xs">
                    From <span>{date(firstGame.endAt).format('DD MMM YYYY, HH:mm:ss')}</span>{' '}
                    {!isActive && lastGame && (
                      <>
                        to <span>{date(lastGame.endAt).format('DD MMM YYYY, HH:mm:ss')}</span>
                      </>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
