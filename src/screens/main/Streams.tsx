import useSWRImmutable from 'swr/immutable';
import { api } from '@api';
import { pluralize } from '@utils';
import { Stream } from '@types';

export const Streams = () => {
  const { data: streams } = useSWRImmutable('/streams', (url) =>
    api.get<{ data: { streams: Array<Stream> } }>(url).then((res) => res.data.data.streams),
  );

  if (!streams || streams.length === 0) {
    return null;
  }

  return (
    <>
      <hr />
      <div>
        <h2 className="text-xl font-semibold">Live streams:</h2>
        <div className="grid grid-cols-1 gap-6 py-2 sm:grid-cols-2 xl:grid-cols-3">
          {streams.map((stream) => (
            <a
              key={stream.username}
              className="flex flex-col gap-1"
              target="_blank"
              rel="noreferrer"
              href={`https://www.twitch.tv/${stream.login}`}
            >
              <img
                width={640}
                height={360}
                alt={`${stream.username} stream`}
                src={stream.thumbnail.replace('{width}', '640').replace('{height}', '360')}
                className="transition-all hover:-translate-y-1 hover:translate-x-1 hover:shadow-[-4px_4px_#772ce8,-3px_3px_#772ce8,-2px_2px_#772ce8,-1px_1px_#772ce8]"
              />
              <div className="flex justify-between gap-2 whitespace-nowrap">
                <span className="overflow-hidden text-ellipsis font-semibold">
                  {stream.username}
                </span>{' '}
                <span>
                  {stream.viewers} {pluralize('viewer', stream.viewers)}
                </span>
              </div>
            </a>
          ))}
        </div>
      </div>
    </>
  );
};
