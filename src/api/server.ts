import axios from 'axios';
import { GetServerSidePropsContext } from 'next';
import { rootUrl } from '@constants';

export const createServerApi = (_ctx?: GetServerSidePropsContext) => {
  const api = axios.create({
    baseURL: `${rootUrl}/api`,
  });

  return {
    api,
  };
};

export const fetchApi: typeof fetch = (url, params) => fetch(`${rootUrl}/api${url}`, params);
