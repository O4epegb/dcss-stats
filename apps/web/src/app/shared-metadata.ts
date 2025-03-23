import { Metadata } from 'next'
import { defaultMetaTitle, defaultMetaDescription } from '~/constants'

export const sharedOGMetadata: Metadata['openGraph'] = {
  title: defaultMetaTitle,
  description: defaultMetaDescription,
  type: 'website',
  images: [
    {
      url: '/logo-256.png',
      width: 256,
      height: 256,
      alt: 'DCSS Stats',
    },
  ],
}
