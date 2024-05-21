'use client'

import { PlayerInfoResponse } from '~types'
import { Player } from '~screens/Player/main'
import { PlayerPageContext, useContextStateValue } from '~screens/Player/context'

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
