import { useState, useContext, createContext } from 'react';
import { setCookie, destroyCookie } from 'nookies';
import { PlayerInfoResponse } from '@types';
import { trackEvent } from '@utils';
import { cookiesStore } from './utils';

export const PlayerPageContext = createContext({} as ReturnType<typeof useContextStateValue>);

export function usePlayerPageContext() {
  return useContext(PlayerPageContext);
}

export const useContextStateValue = (
  data: PlayerInfoResponse,
  defaultCookiesStore: Record<string, boolean>,
) => {
  const [cookieState, setCookieState] = useState(() => ({
    ...cookiesStore,
    ...defaultCookiesStore,
  }));

  return {
    ...data,
    isOptionEnabled(key: keyof typeof cookiesStore) {
      return cookieState[key];
    },
    toggleOption(key: keyof typeof cookiesStore) {
      const newState = !cookieState[key];

      trackEvent('key', { state: String(newState) });

      if (newState) {
        saveCookie(key);
      } else {
        deleteCookie(key);
      }

      setCookieState((state) => ({ ...state, [key]: newState }));
    },
  };
};

const saveCookie = (key: string) => {
  setCookie(null, key, '1', { path: '/', maxAge: 31536000 });
};

const deleteCookie = (key: string) => {
  destroyCookie(null, key, { path: '/' });
};
