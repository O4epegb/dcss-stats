import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import relativeTimePlugin from 'dayjs/plugin/relativeTime';
import durationPlugin from 'dayjs/plugin/duration';

dayjs.extend(utc);
dayjs.extend(relativeTimePlugin);
dayjs.extend(durationPlugin);

export const date = dayjs;

export class RaceConditionGuard {
  private lastPromise: PromiseLike<unknown> | null = null;

  getGuardedPromise<T>(promise: PromiseLike<T>) {
    this.lastPromise = promise;
    return this.lastPromise.then(this.preventRaceCondition()) as Promise<T>;
  }

  preventRaceCondition() {
    const currentPromise = this.lastPromise;
    return (response: unknown) => {
      if (this.lastPromise !== currentPromise) {
        return new Promise(() => null);
      }
      return response;
    };
  }

  cancel = () => {
    this.lastPromise = null;
  };
}

export const addS = (string: string, count: number) => string + (count === 1 ? '' : 's');

export const formatDuration = (seconds: number) => {
  const d = date.duration(seconds, 'seconds');
  const days = d.get('days');

  return `${days > 0 ? `${days} ${addS('day', days)} ` : ''}${d.format('HH:mm:ss')}`;
};

export const formatNumber = (n: number, options?: Intl.NumberFormatOptions) => {
  return n.toLocaleString('en-EN', options);
};

export const roundAndFormat = (n: number | null, options?: Intl.NumberFormatOptions) => {
  return n !== null ? formatNumber(n, options) : '0';
};

export const getPlayerPageHref = (slug: string) => ({
  pathname: `/players/[slug]`,
  query: {
    slug,
  },
});

declare global {
  interface Window {
    splitbee?: {
      track: typeof trackEvent;
    };
  }
}

export const trackEvent = (type: string, data?: Record<string, string>) => {
  window.splitbee?.track(type, data);
};
