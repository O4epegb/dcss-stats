const trimTrailingSlash = (value: string) => value.replace(/\/$/, '')

export const apiUrl = trimTrailingSlash(import.meta.env.VITE_API_URL || 'https://dcss-stats.com')

export const webUrl = trimTrailingSlash(import.meta.env.VITE_WEB_URL || 'https://dcss-stats.com')
