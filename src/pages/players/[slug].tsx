import axios from 'axios';
import dayjs from 'dayjs';
import relativeTimePlugin from 'dayjs/plugin/relativeTime';
import durationPlugin from 'dayjs/plugin/duration';
import { GetStaticPaths, GetStaticProps } from 'next';
import { PlayerInfoResponse } from '@types';
import { createServerApi } from '@api/server';

import { Player, Props } from '@screens/Player';

dayjs.extend(relativeTimePlugin);
dayjs.extend(durationPlugin);

const PlayerPage = (props: Props) => {
  return <Player {...props} />;
};

type Params = { slug: string };

export const getStaticPaths: GetStaticPaths<Params> = async () => {
  return {
    fallback: 'blocking',
    paths: [],
  };
};

export const getStaticProps: GetStaticProps<Props, Params> = async ({ params }) => {
  if (!params) {
    return {
      notFound: true,
    };
  }

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
      revalidate: 300,
      props: {
        ...res.data,
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
