import { cacheLife } from 'next/cache'
import { fetchApi } from '~/api/server'
import { Stream } from '~/types'
import { cn, pluralize } from '~/utils'

export const Streams = async () => {
  'use cache'

  cacheLife({
    stale: 30,
    revalidate: 60,
    expire: 5 * 60,
  })

  const response: { data: { streams: Array<Stream> } } = await fetchApi('/streams').then((r) =>
    r.json(),
  )

  const streams = response.data.streams

  if (streams.length === 0) {
    return null
  }

  return (
    <div>
      <h2 className="text-xl font-semibold">Live streams</h2>
      <div className="flex gap-4 overflow-x-auto pt-2 pb-3 sm:grid sm:grid-cols-2 sm:gap-6 sm:overflow-x-visible sm:pb-0 xl:grid-cols-3">
        {streams.map((stream) => (
          <a
            key={stream.id}
            className="flex w-48 min-w-48 shrink-0 flex-col gap-1 sm:w-full sm:min-w-0"
            target="_blank"
            rel="noreferrer"
            href={stream.url}
          >
            <img
              width={320}
              height={180}
              alt={`${stream.username} stream thumbnail`}
              src={stream.thumbnail.replace('{width}', '640').replace('{height}', '360')}
              className={cn(
                'aspect-video w-full object-cover transition-all hover:translate-x-1 hover:-translate-y-1',
                stream.platform === 'twitch'
                  ? 'hover:shadow-[-5px_5px_var(--color-brand-twitch),-4px_4px_var(--color-brand-twitch),-3px_3px_var(--color-brand-twitch),-2px_2px_var(--color-brand-twitch),-1px_1px_var(--color-brand-twitch)]'
                  : 'hover:shadow-[-5px_5px_var(--color-brand-youtube),-4px_4px_var(--color-brand-youtube),-3px_3px_var(--color-brand-youtube),-2px_2px_var(--color-brand-youtube),-1px_1px_var(--color-brand-youtube)]',
              )}
            />
            <div className="flex justify-between gap-2 whitespace-nowrap">
              <span className="min-w-0 overflow-hidden font-semibold text-ellipsis">
                {stream.username}
                <span className="text-muted-foreground text-sm font-extralight">
                  {' '}
                  · {stream.platform === 'youtube' ? 'YouTube' : 'Twitch'}
                </span>
              </span>
              <span className="shrink-0">
                {stream.viewers === null
                  ? 'Viewers hidden'
                  : `${stream.viewers} ${pluralize('viewer', stream.viewers)}`}
              </span>
            </div>
          </a>
        ))}
      </div>
    </div>
  )
}
