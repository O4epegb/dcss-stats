import { useState, useContext, createContext } from 'react';
import { PlayerInfoResponse } from '@types';

export const PlayerPageContext = createContext({} as ReturnType<typeof useContextState>);

export function usePlayerPageContext() {
  return useContext(PlayerPageContext);
}

export const useContextState = (data: PlayerInfoResponse) => {
  const [isCompact, setIsCompact] = useState(() => false);

  return { ...data, isCompact, setIsCompact };
};
