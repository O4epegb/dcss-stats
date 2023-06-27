const rootUrl = process.env.NEXT_PUBLIC_ROOT_URL;

/** @type {import('next').NextConfig} */
const config = {
  transpilePackages: ['lodash-es'],
  eslint: {
    ignoreDuringBuilds: true,
  },
  async rewrites() {
    return [
      {
        source: '/api/:slug*',
        destination: `${rootUrl}/api/:slug*`,
      },
    ].filter(Boolean);
  },
};

module.exports = config;
