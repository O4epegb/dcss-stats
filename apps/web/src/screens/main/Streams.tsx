import { cacheLife } from 'next/cache'
import { fetchApi } from '~/api/server'
import { Stream } from '~/types'
import { pluralize } from '~/utils'

export const Streams = async () => {
  'use cache'

  cacheLife({
    stale: 20,
    revalidate: 30,
    expire: 120,
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
      <h2 className="text-xl font-semibold">Live streams:</h2>
      <div className="flex gap-4 overflow-x-auto pt-2 pb-3 sm:grid sm:grid-cols-2 sm:gap-6 sm:overflow-x-visible sm:pb-0 xl:grid-cols-3">
        {streams.map((stream) => (
          <a
            key={stream.username}
            className="flex w-48 min-w-48 shrink-0 flex-col gap-1 sm:w-full sm:min-w-0"
            target="_blank"
            rel="noreferrer"
            href={`https://www.twitch.tv/${stream.login}`}
          >
            <img
              width={320}
              height={180}
              alt={`${stream.username} stream thumbnail`}
              src={stream.thumbnail.replace('{width}', '640').replace('{height}', '360')}
              className="w-full transition-all hover:translate-x-1 hover:-translate-y-1 hover:shadow-[-5px_5px_#772ce8,-4px_4px_#772ce8,-3px_3px_#772ce8,-2px_2px_#772ce8,-1px_1px_#772ce8] sm:min-h-0"
            />
            <div className="flex justify-between gap-2 whitespace-nowrap">
              <span className="overflow-hidden font-semibold text-ellipsis">{stream.username}</span>{' '}
              <span>
                {stream.viewers} {pluralize('viewer', stream.viewers)}
              </span>
            </div>
          </a>
        ))}
      </div>
    </div>
  )
}
