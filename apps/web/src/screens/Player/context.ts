import { setCookie, destroyCookie } from 'nookies'
import { useState, useContext, createContext } from 'react'
import { PlayerInfoResponse } from '~/types'
import { trackEvent } from '~/utils'
import { cookiesStoreDefault, getSummary } from './utils'

export const PlayerPageContext = createContext({} as ReturnType<typeof useContextStateValue>)

export function usePlayerPageContext() {
  return useContext(PlayerPageContext)
}

export const useContextStateValue = (
  data: PlayerInfoResponse,
  defaultCookiesStore: Record<string, boolean>,
) => {
  const [cookieState, setCookieState] = useState(() => ({
    ...cookiesStoreDefault,
    ...defaultCookiesStore,
  }))

  return {
    ...data,
    summary: getSummary(data),
    isOptionEnabled(key: keyof typeof cookiesStoreDefault) {
      return cookieState[key]
    },
    toggleOption(key: keyof typeof cookiesStoreDefault) {
      const newState = !cookieState[key]

      trackEvent('key', { state: String(newState) })

      if (newState) {
        saveCookie(key)
      } else {
        deleteCookie(key)
      }

      setCookieState((state) => ({ ...state, [key]: newState }))
    },
  }
}

const saveCookie = (key: string) => {
  setCookie(null, key, '1', { path: '/', maxAge: 31536000 })
}

const deleteCookie = (key: string) => {
  destroyCookie(null, key, { path: '/' })
}
