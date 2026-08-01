import { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { defaultMetaTitle } from '~/constants'
import { sharedOGMetadata } from './shared-metadata'

const title = `404 | ${defaultMetaTitle}`

export const metadata: Metadata = {
  title,
  openGraph: {
    ...sharedOGMetadata,
    title,
  },
}

const Page404 = () => {
  const abyssImage = (
    <Image
      width={32}
      height={32}
      src="/exit_abyss.png"
      alt="Exit the Abyss"
      className="pixelated inline-block size-6"
    />
  )

  return (
    <div className="flex h-screen flex-col items-center justify-center p-4 text-center font-mono">
      <h1 className="text-danger mb-4 flex items-center justify-center gap-4 text-6xl">
        <Image
          width={32}
          height={32}
          src="/dragon_form_octopode.png"
          alt=""
          className="pixelated size-8"
        />
        404
        <Image
          width={32}
          height={32}
          src="/lich_form_octopode.png"
          alt=""
          className="pixelated size-8"
        />
      </h1>
      <p className="mb-2 text-xl">* The page you were looking for has vanished into the Abyss *</p>
      <p className="text-muted-foreground mb-8 text-base italic">
        You feel a terrible presence watching...
      </p>
      <Link
        href="/"
        prefetch={false}
        className="text-link hover:text-link-hover text-lg transition-colors"
      >
        {abyssImage} Return to the Dungeon {abyssImage}
      </Link>
    </div>
  )
}

export default Page404
