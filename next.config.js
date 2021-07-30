// const rootUrl =
//   process.env.NEXT_PUBLIC_ROOT_URL || 'https://stage.example.com';

const withTM = require('next-transpile-modules')(['lodash-es']);

module.exports = withTM({
  eslint: {
    ignoreDuringBuilds: true,
  },
  // async rewrites() {
  //   return [
  //     ...(process.env.NODE_ENV === 'development'
  //       ? [
  //           {
  //             source: '/api/:slug*',
  //             destination: `${rootUrl}/api/:slug*`,
  //           },
  //           {
  //             source: '/uploads/:slug*',
  //             destination: `${rootUrl}/uploads/:slug*`,
  //           },
  //         ]
  //       : []),
  //   ].filter(Boolean);
  // },
});
