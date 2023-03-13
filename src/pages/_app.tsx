import { AppProps } from 'next/app';
import Head from 'next/head';
import { ErrorBoundary } from '@utils/bugsnag';
import { Analytics } from '@vercel/analytics/react';
import Page500 from './_error';

import '@styles/globals.css';

const title = 'DCSS Stats';
const description = 'Player and game statistics for Dungeon Crawl Stone Soup Online';

const CustomApp = ({ Component, pageProps }: AppProps): JSX.Element => {
  return (
    <ErrorBoundary FallbackComponent={Page500 as any}>
      {process.env.NODE_ENV === 'production' && <Analytics />}
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="format-detection" content="telephone=no" />
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta
          name="keywords"
          content="Dungeon Crawl Stone Soup, DCSS Online, Dungeon Crawl Online, DCSS Webtiles, Linley's Dungeon Crawl, Dungeon Crawl Stone Soup Stats, DCSS Stats, DCSS statistics"
        />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="/logo-256.png" />
        <meta property="og:image:width" content="256" />
        <meta property="og:image:height" content="256" />
      </Head>
      <Component {...pageProps} />
    </ErrorBoundary>
  );
};

export default CustomApp;
