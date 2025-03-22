import clsx from 'clsx'
import { last, first, orderBy } from 'lodash-es'
import { useState } from 'react'
import { api } from '~/api'
import { GameTooltip } from '~/components/GameTooltip'
import { Loader } from '~/components/ui/Loader'
import { Game } from '~/types'
import { pluralize, date, formatNumber } from '~/utils'
import { List } from './Stats'
import { usePlayerPageContext } from './context'

type StreakGame = Pick<Game, 'id' | 'isWin' | 'endAt' | 'char'>
type StreakGroups = Array<StreakGame[]>

export const Streaks = () => {
  const { streaks, player } = usePlayerPageContext()
  const [streakGroups, setStreakGroups] = useState<StreakGroups>([])
  const [isVisible, setIsVisible] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

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
          <div className="text-right text-sm text-emerald-500">
            🔥 On streak: {streaks.current} wins in a row
          </div>
        )}
      </header>
      {streaks.total > 0 && (
        <div className="flex items-center gap-2 whitespace-nowrap text-sm">
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
            className="ml-auto py-0.5 text-sm text-blue-400 hover:underline"
            onClick={() => {
              if (streakGroups.length > 0) {
                setIsVisible((state) => !state)

                return
              }

              setIsLoading(true)

              api
                .get<{ streaks: { streaks: StreakGroups } }>(`/players/${player.id}/streaks`)
                .then((res) => {
                  setStreakGroups(res.data.streaks.streaks)
                  setIsVisible(true)
                })
                .catch((e) => {
                  alert('Error while loading streaks')

                  throw e
                })
                .finally(() => {
                  setIsLoading(false)
                })
            }}
          >
            {isVisible ? 'Hide' : 'Show'} streaks
          </button>
        </div>
      )}
      {isLoading && <Loader />}
      {isVisible && (
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
                className={clsx(
                  'rounded border border-gray-200 px-2 py-1 text-sm dark:border-gray-300',
                  isActive && 'border-l-2 border-l-emerald-500 dark:border-l-emerald-500',
                )}
              >
                {isActive && <div className="text-emerald-500">Active streak</div>}
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
                  <div className="pt-0.5 text-xs text-gray-400">
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
