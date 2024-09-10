import { useState } from 'react'
import useSWRImmutable from 'swr/immutable'
import { api } from '~/api'
import { Tooltip } from '~/components/ui/Tooltip'
import { Game } from '~/types'
import { GameItem } from './GameItem'

export const GameTooltip = ({
  children,
  ...rest
}: {
  player: string
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
)) => {
  const [isActive, setIsActive] = useState(false)
  const { data, error } = useSWRImmutable(isActive ? ['/games', rest] : null, ([url, params]) =>
    api.get<{ data: Game[]; count: number }>(url, { params }).then((res) => res.data),
  )

  return (
    <Tooltip
      interactive
      delay={100}
      content={
        data ? (
          data.data.length > 0 ? (
            <GameItem game={data.data[0]} />
          ) : (
            'Game not found'
          )
        ) : error ? (
          'Error occured, try to reload the page'
        ) : (
          'Loading'
        )
      }
      onOpenChange={() => setIsActive(true)}
    >
      {children}
    </Tooltip>
  )
}
