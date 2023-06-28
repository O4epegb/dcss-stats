'use client';

import { PlayerInfoResponse } from '@types';
import { Player } from '@screens/Player/main';
import { PlayerPageContext, useContextState } from '@screens/Player/context';

type Props = PlayerInfoResponse & { isCompact: boolean; isFiltersOpen: boolean };

export const PlayerPage = (props: Props) => {
  const value = useContextState(props, props.isCompact, props.isFiltersOpen);

  return (
    <PlayerPageContext.Provider value={value}>
      <Player />;
    </PlayerPageContext.Provider>
  );
};

export default PlayerPage;
