import { useState, useContext, createContext } from 'react';
import { setCookie, destroyCookie } from 'nookies';
import { PlayerInfoResponse } from '@types';
import { trackEvent } from '@utils';
import { cookieKeyCompactView, cookieKeyOpenFilters } from './utils';

export const PlayerPageContext = createContext({} as ReturnType<typeof useContextState>);

export function usePlayerPageContext() {
  return useContext(PlayerPageContext);
}

export const useContextState = (
  data: PlayerInfoResponse,
  isCompactDefault: boolean,
  isFiltersOpenDefault: boolean,
) => {
  const [isCompact, setIsCompact] = useState(isCompactDefault);
  const [isFiltersOpen, setIsFiltersOpen] = useState(isFiltersOpenDefault);

  return {
    ...data,
    isCompact,
    isFiltersOpen,
    toggleCompact() {
      const newState = !isCompact;

      trackEvent('settings', { isCompact: String(newState) });

      if (newState) {
        saveCookie(cookieKeyCompactView);
      } else {
        deleteCookie(cookieKeyCompactView);
      }

      setIsCompact(newState);
    },
    toggleFilters() {
      const newState = !isFiltersOpen;

      trackEvent('filters', { isOpen: String(newState) });

      if (newState) {
        saveCookie(cookieKeyOpenFilters);
      } else {
        deleteCookie(cookieKeyOpenFilters);
      }

      setIsFiltersOpen(newState);
    },
  };
};

const saveCookie = (key: string) => {
  setCookie(null, key, '1', { path: '/', maxAge: 31536000 });
};

const deleteCookie = (key: string) => {
  destroyCookie(null, key, { path: '/' });
};
