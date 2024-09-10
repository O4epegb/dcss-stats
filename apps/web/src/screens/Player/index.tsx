'use client'

import { PlayerPageContext, useContextStateValue } from '~/screens/Player/context'
import { Player } from '~/screens/Player/main'
import { PlayerInfoResponse } from '~/types'

type Props = PlayerInfoResponse & {
  cookiesStore: Record<string, boolean>
}

export const PlayerPage = (props: Props) => {
  const value = useContextStateValue(props, props.cookiesStore)

  return (
    <PlayerPageContext.Provider value={value}>
      <Player />
    </PlayerPageContext.Provider>
  )
}

export default PlayerPage
