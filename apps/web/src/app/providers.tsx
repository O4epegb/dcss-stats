'use client'

import { ProgressProvider } from '@bprogress/next/app'
import { ThemeProvider } from 'next-themes'
import { appThemeNames } from '~/constants'

export const Providers: React.FC<React.PropsWithChildren> = ({ children }) => {
  return (
    <ThemeProvider
      disableTransitionOnChange
      enableColorScheme
      enableSystem
      attribute="class"
      themes={appThemeNames}
    >
      <ProgressProvider
        shallowRouting
        height="4px"
        color="rgb(180 83 9)"
        options={{ showSpinner: false }}
      >
        {children}
      </ProgressProvider>
    </ThemeProvider>
  )
}
