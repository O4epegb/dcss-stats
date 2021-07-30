import React, { ComponentType, ErrorInfo } from 'react';
import Bugsnag from '@bugsnag/js';
import BugsnagPluginReact from '@bugsnag/plugin-react';

const useBugsnag = process.env.NEXT_PUBLIC_APP_ENV === 'production';

if (useBugsnag) {
  Bugsnag.start({
    apiKey: '72e83e4300c7f6a86882f6958c961bb4',
    plugins: [new BugsnagPluginReact(React)],
    releaseStage: process.env.NEXT_PUBLIC_APP_ENV,
  });
}

class DevErrorBoundary extends React.Component<
  { FallbackComponent: ComponentType },
  { error: Error | null; info: ErrorInfo | null }
> {
  state = {
    error: null,
    info: null,
  };

  componentDidCatch(error: Error, info: ErrorInfo) {
    this.setState({ error, info });
  }

  render() {
    const { error } = this.state;
    const { FallbackComponent, children } = this.props;

    return error ? <FallbackComponent /> : children;
  }
}

const BugsnagBoundary = useBugsnag && Bugsnag.getPlugin('react')?.createErrorBoundary();
export const ErrorBoundary = BugsnagBoundary ? BugsnagBoundary : DevErrorBoundary;

export const notify = (error: Error) => {
  if (useBugsnag) {
    Bugsnag.notify(error);
  }
};
