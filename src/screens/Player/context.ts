import { useState, useContext, createContext } from 'react';
import { setCookie, destroyCookie } from 'nookies';
import { PlayerInfoResponse } from '@types';
import { trackEvent } from '@utils';
import { cookieKey } from './utils';

export const PlayerPageContext = createContext({} as ReturnType<typeof useContextState>);

export function usePlayerPageContext() {
  return useContext(PlayerPageContext);
}

export const useContextState = (data: PlayerInfoResponse, isCompactDefault: boolean) => {
  const [isCompact, setIsCompact] = useState(isCompactDefault);

  return {
    ...data,
    isCompact,
    toggleCompact() {
      const newState = !isCompact;

      trackEvent('settings', { isCompact: String(newState) });

      if (newState) {
        setCookie(null, cookieKey, '1', { path: '/', maxAge: 31536000 });
      } else {
        destroyCookie(null, cookieKey, { path: '/' });
      }

      setIsCompact(newState);
    },
  };
};
