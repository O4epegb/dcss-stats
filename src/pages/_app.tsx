import { AppProps } from 'next/app';
import Head from 'next/head';
import Script from 'next/script';
import { ErrorBoundary } from '@utils/bugsnag';
import Page500 from './_error';

import '@styles/globals.css';

const CustomApp = ({ Component, pageProps }: AppProps): JSX.Element => {
  return (
    <ErrorBoundary FallbackComponent={Page500 as any}>
      {process.env.NODE_ENV === 'production' && <Script src="https://cdn.splitbee.io/sb.js" />}
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="format-detection" content="telephone=no" />
        <title>DCSS Stats</title>
        <meta
          name="description"
          content="Player and game statistics for Dungeon Crawl Stone Soup Online"
        />
        <meta
          name="keywords"
          content="Dungeon Crawl Stone Soup, DCSS Online, Dungeon Crawl Online, DCSS Webtiles, Linley's Dungeon Crawl, Dungeon Crawl Stone Soup Stats, DCSS Stats, DCSS statistics"
        />
      </Head>
      <Component {...pageProps} />
    </ErrorBoundary>
  );
};

export default CustomApp;
