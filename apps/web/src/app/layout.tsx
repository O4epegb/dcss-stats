import '~/styles/globals.css'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { Metadata } from 'next'
import Script from 'next/script'
import { defaultMetaDescription, defaultMetaTitle } from '~/constants'
import { Providers } from './providers'
import { sharedOGMetadata } from './shared-metadata'

export const metadata: Metadata = {
  metadataBase: new URL('https://dcss-stats.com'),
  title: defaultMetaTitle,
  description: defaultMetaDescription,
  keywords:
    "Dungeon Crawl Stone Soup, DCSS Online, Dungeon Crawl Online, DCSS Webtiles, Linley's Dungeon Crawl, Dungeon Crawl Stone Soup Stats, DCSS Stats, DCSS statistics, DCSS player stats, DCSS player history",
  openGraph: {
    ...sharedOGMetadata,
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html suppressHydrationWarning lang="en">
      <head>
        <meta name="format-detection" content="telephone=no" />
      </head>
      <body className="antialiased">
        <Providers>
          <div className="mb-4 border-b border-yellow-300 bg-yellow-100 p-2 text-center text-xs md:text-sm">
            Data maintenance is in progress. Some stats may be outdated or missing.
          </div>
          {children}
        </Providers>
        {process.env.NODE_ENV === 'production' && <Analytics />}
        {process.env.NODE_ENV === 'production' && (
          <Script
            src="https://analytics.umami.is/script.js"
            data-website-id="ddb2a2da-618f-4c49-b230-c7b9b66ccd7c"
          />
        )}
        <SpeedInsights />
      </body>
    </html>
  )
}
