'use client'

import { ThemeProvider } from 'next-themes'

export const Providers: React.FC<React.PropsWithChildren> = ({ children }) => {
  return (
    <ThemeProvider disableTransitionOnChange enableColorScheme enableSystem attribute="class">
      {children}
    </ThemeProvider>
  )
}
