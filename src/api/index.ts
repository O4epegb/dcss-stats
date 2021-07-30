import axios from 'axios';
import { rootUrl } from '@constants';

export const api = axios.create({
  baseURL: `${rootUrl}/api`,
  withCredentials: true,
});
