import ErrorPage from 'next/error';
import { Page } from '@types';
import { notify } from '@utils/bugsnag';

const Page500: Page<{ statusCode?: number }> = ({ statusCode }) => {
  return <ErrorPage statusCode={statusCode ?? 500} />;
};

Page500.getInitialProps = (ctx) => {
  if (ctx.err) {
    notify(ctx.err);
  }

  return ErrorPage.getInitialProps(ctx);
};

export default Page500;
