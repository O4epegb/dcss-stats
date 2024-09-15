import { type ClassValue, clsx } from 'clsx'
import dayjs from 'dayjs'
import durationPlugin from 'dayjs/plugin/duration'
import localizedFormat from 'dayjs/plugin/localizedFormat'
import relativeTimePlugin from 'dayjs/plugin/relativeTime'
import updateLocale from 'dayjs/plugin/updateLocale'
import utc from 'dayjs/plugin/utc'
import weekOfYear from 'dayjs/plugin/weekOfYear'
import qs from 'qs'
import { twMerge } from 'tailwind-merge'

dayjs.extend(updateLocale)
dayjs.extend(localizedFormat)
dayjs.extend(weekOfYear)
dayjs.extend(utc)
dayjs.extend(relativeTimePlugin)
dayjs.extend(durationPlugin)

dayjs.updateLocale('en', {
  weekStart: 1,
})

export const date = dayjs

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export class RaceConditionGuard {
  private lastPromise: PromiseLike<unknown> | null = null

  getGuardedPromise<T>(promise: PromiseLike<T>) {
    this.lastPromise = promise
    return this.lastPromise.then(this.preventRaceCondition()) as Promise<T>
  }

  preventRaceCondition() {
    const currentPromise = this.lastPromise
    return (response: unknown) => {
      if (this.lastPromise !== currentPromise) {
        return new Promise(() => null)
      }
      return response
    }
  }

  cancel = () => {
    this.lastPromise = null
  }
}

export const pluralize = (string: string, count: number) => string + (count === 1 ? '' : 's')

export const formatDuration = (seconds: number) => {
  const d = date.duration(seconds, 'seconds')
  const days = d.get('days')

  return `${days > 0 ? `${days} ${pluralize('day', days)} ` : ''}${d.format('HH:mm:ss')}`
}

export const formatNumber = (n: number, options?: Intl.NumberFormatOptions) => {
  return n.toLocaleString('en-EN', options)
}

export const roundAndFormat = (n: number | null, options?: Intl.NumberFormatOptions) => {
  return n !== null ? formatNumber(n, options) : '0'
}

export const trackEvent = (_type: string, _data?: Record<string, string>) => {
  // Pro plan only => https://vercel.com/docs/concepts/analytics/custom-events
  // window.splitbee?.track(type, data);
}

export function notEmpty<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined
}

export const stringifyQuery: typeof qs.stringify = (query, options) => {
  return qs.stringify(query, {
    skipNulls: true,
    arrayFormat: 'repeat',
    format: 'RFC1738',
    ...options,
  })
}
