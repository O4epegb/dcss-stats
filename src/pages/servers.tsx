import { GetStaticProps } from 'next';
import { orderBy } from 'lodash-es';
import { addS, date, formatNumber } from '@utils';
import { Logfile, Server } from '@types';
import { createServerApi } from '@api/server';
import { Logo } from '@components/Logo';
import { Tooltip } from '@components/Tooltip';

const ServersPage = (props: Props) => {
  return (
    <div className="container mx-auto flex min-h-screen flex-col items-center space-y-4 px-4 pt-4">
      <header>
        <Logo />
      </header>

      <div className="w-full max-w-lg space-y-2">
        <h2 className="text-lg font-semibold">Tracking 12 {addS('server', 12)}:</h2>

        {props.servers.map((server) => {
          const total = server.logfile.reduce((acc, item) => acc + item.games, 0);

          return (
            <div key={server.id} className="rounded border px-2 py-1">
              <div className="flex justify-between">
                <a
                  href={server.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="white-nowrap overflow-hidden overflow-ellipsis"
                >
                  <span className="font-medium">{server.abbreviation}</span> - {server.url}
                </a>
                <div className="whitespace-nowrap">
                  {formatNumber(total)} {addS('game', total)}
                </div>
              </div>
              <details>
                <summary>
                  {server.logfile.length} {addS('logfile', server.logfile.length)}
                </summary>
                <ul className="text-sm">
                  {orderBy(server.logfile, (x) => Number(x.version)).map((file) => {
                    return (
                      <Tooltip
                        key={file.path}
                        content={
                          file.lastFetched && `Last fetched: ${date(file.lastFetched).format()}`
                        }
                      >
                        <li className="flex justify-between px-1 hover:bg-gray-100">
                          <a
                            href={server.baseUrl + file.path}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {file.path}
                          </a>
                          <div className="whitespace-nowrap">
                            {formatNumber(file.games)} {addS('game', file.games)}
                          </div>
                        </li>
                      </Tooltip>
                    );
                  })}
                </ul>
              </details>
            </div>
          );
        })}
      </div>
    </div>
  );
};

type Props = Response;

type Response = {
  servers: Array<Server & { logfile: Array<Logfile> }>;
};

export const getStaticProps: GetStaticProps<Props> = async () => {
  const res = await createServerApi().api.get<Response>('/servers');

  return {
    revalidate: 300,
    props: res.data,
  };
};

export default ServersPage;
