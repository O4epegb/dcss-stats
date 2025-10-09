const rootUrl = process.env.NEXT_PUBLIC_ROOT_URL

/** @type {import('next').NextConfig} */
const config = {
  transpilePackages: ['lodash-es'],
  // For some reason needed for /api/docs to work
  skipTrailingSlashRedirect: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  async rewrites() {
    return {
      beforeFiles: [
        // For some reason needed for /api/docs to work
        {
          source: '/api/docs/',
          destination: `${rootUrl}/api/docs/`,
        },
        {
          source: '/api/:slug*',
          destination: `${rootUrl}/api/:slug*`,
        },
      ].filter(Boolean),
    }
  },
}

module.exports = config
