import axios from 'axios';
import qs from 'qs';
import { rootUrl } from '@constants';

export const api = axios.create({
  baseURL: `${rootUrl}/api`,
  withCredentials: true,
  paramsSerializer: (params) => qs.stringify(params),
});
