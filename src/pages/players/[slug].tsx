import axios from 'axios';
import nookies from 'nookies';
import { GetServerSideProps } from 'next';
import { PlayerInfoResponse } from '@types';
import { createServerApi } from '@api/server';
import { Player } from '@screens/Player';
import { PlayerPageContext, useContextState } from '@screens/Player/context';
import { cookieKey } from '@screens/Player/utils';

type Props = PlayerInfoResponse & { isCompact: boolean };

const PlayerPage = (props: Props) => {
  const value = useContextState(props, props.isCompact);

  return (
    <PlayerPageContext.Provider value={value}>
      <Player />;
    </PlayerPageContext.Provider>
  );
};

type Params = { slug: string };

export const getServerSideProps: GetServerSideProps<Props, Params> = async (ctx) => {
  const { params } = ctx;

  if (!params) {
    return {
      notFound: true,
    };
  }

  const cookies = nookies.get(ctx);

  try {
    const res = await createServerApi().api.get<PlayerInfoResponse>(`/players/${params.slug}`);

    if (res.data.player.name !== params.slug) {
      return {
        redirect: {
          destination: `/players/${res.data.player.name}`,
          permanent: false,
        },
      };
    }

    return {
      props: {
        ...res.data,
        isCompact: Boolean(cookies[cookieKey]),
      },
    };
  } catch (error) {
    if (!axios.isAxiosError(error)) {
      throw error;
    }

    if (error.response?.status === 404) {
      return {
        notFound: true,
      };
    }

    throw error;
  }
};

export default PlayerPage;
