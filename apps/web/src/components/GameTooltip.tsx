import { Popover } from '@base-ui/react/popover'
import { useState, type JSX } from 'react'
import useSWRImmutable from 'swr/immutable'
import { api } from '~/api'
import { Game } from '~/types'
import { GameCard } from './GameCard'

type GameTooltipProps = {
  children: JSX.Element
} & (
  | {
      isWin: boolean
      title: string
      player: string
    }
  | {
      id: string
    }
  | {
      game: Game
    }
)

const useGameTooltipData = (rest: Omit<GameTooltipProps, 'children'>) => {
  const isGameProvided = 'game' in rest
  const [isActive, setIsActive] = useState(false)
  const { data, error, isLoading } = useSWRImmutable(
    !isGameProvided && isActive ? ['/games', rest] : null,
    ([url, params]) =>
      api.get<{ data: Game[]; count: number }>(url, { params }).then((res) => res.data),
  )

  return {
    data,
    error,
    isLoading,
    setIsActive,
  }
}

export const GameTooltip = ({ children, ...rest }: GameTooltipProps) => {
  const { data, error, isLoading, setIsActive } = useGameTooltipData(rest)
  const game = 'game' in rest ? rest.game : data?.data[0]

  return (
    <Popover.Root onOpenChange={(open) => open && setIsActive(true)}>
      <Popover.Trigger
        openOnHover
        nativeButton={false}
        delay={100}
        closeDelay={120}
        render={children}
      />
      <Popover.Portal>
        <Popover.Positioner side="top" sideOffset={8} className="z-20 outline-none">
          <Popover.Popup className="max-w-[calc(100vw-8px)] origin-(--transform-origin) bg-[canvas] shadow-lg shadow-gray-200 transition-[transform,scale,opacity] data-ending-style:scale-90 data-ending-style:opacity-0 data-starting-style:scale-90 data-starting-style:opacity-0 dark:shadow-none">
            {game ? (
              <GameCard game={game} />
            ) : (
              <div className="rounded border p-4">
                {error ? 'Failed to load game data' : isLoading ? 'Loading...' : 'Game not found'}
              </div>
            )}
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  )
}
