import { AppProps } from 'next/app';
import Head from 'next/head';
import Script from 'next/script';

import '@styles/globals.css';

const CustomApp = ({ Component, pageProps }: AppProps): JSX.Element => {
  return (
    <>
      {process.env.NODE_ENV === 'production' && <Script src="https://cdn.splitbee.io/sb.js" />}
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="format-detection" content="telephone=no" />
      </Head>
      <Component {...pageProps} />
    </>
  );
};

export default CustomApp;
