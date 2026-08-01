export const isProduction = process.env.NODE_ENV === 'production'

export const canUseDOM: boolean =
  typeof window !== 'undefined' && Boolean(window.document && window.document.createElement)

export const rootUrl =
  process.env.NEXT_PUBLIC_ROOT_URL ||
  (process.env.NEXT_PUBLIC_APP_ENV === 'production'
    ? 'https://example.com'
    : 'https://stage.example.com')

export const defaultMetaTitle = 'DCSS Stats'
export const defaultMetaDescription =
  'Player and game statistics for Dungeon Crawl Stone Soup Online'

export const appThemes = [
  { name: 'light', label: 'Light' },
  { name: 'dark', label: 'Dark' },
  { name: 'crawl', label: 'Crawl' },
] as const

export const appThemeNames = appThemes.map(({ name }) => name)
export const systemTheme = { name: 'system', label: 'System' } as const
export const selectableThemes = [...appThemes, systemTheme]
export type SelectableThemeName = (typeof selectableThemes)[number]['name']
