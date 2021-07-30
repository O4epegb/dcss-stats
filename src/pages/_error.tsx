import ErrorPage from 'next/error';
import { Page } from '@types';
import Bugsnag from '@bugsnag/js';

const Page500: Page<{ statusCode?: any }> = ({ statusCode }) => {
  return <ErrorPage statusCode={statusCode || '¯\\_(ツ)_/¯'} />;
};

Page500.getInitialProps = (ctx) => {
  if (ctx.err) {
    Bugsnag.notify(ctx.err);
  }

  return ErrorPage.getInitialProps(ctx);
};

export default Page500;
