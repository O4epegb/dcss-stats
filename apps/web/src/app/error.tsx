'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect } from 'react'
import { notify } from '~/utils/bugsnag'

const ErrorPage = ({ error, reset }: { error: Error; reset: () => void }) => {
  useEffect(() => {
    notify(error)
  }, [error])

  const teleportImage = (
    <Image
      width={32}
      height={32}
      src="/teleport_permanent.png"
      alt="Exit the Abyss"
      className="inline-block size-6"
    />
  )

  const orbImage = (
    <Image
      width={32}
      height={32}
      src="/orb_of_zot5.png"
      alt="The Orb of Zot"
      className="inline-block size-8"
    />
  )

  return (
    <div className="flex h-screen flex-col items-center justify-center p-4 text-center font-mono">
      <h1 className="mb-4 flex items-center justify-center gap-4 text-6xl text-red-500">
        <Image width={32} height={32} src="/dragon_form_octopode.png" alt="" className="size-8" />
        500
        <Image width={32} height={32} src="/lich_form_octopode.png" alt="" className="size-8" />
      </h1>
      <p className="mb-2 text-xl">* A terrible malfunction echoes through the Dungeon *</p>
      <p className="mb-8 text-base text-gray-600 italic dark:text-gray-400">
        Pain shoots through your body!
      </p>
      <div className="flex w-full flex-col items-center justify-center gap-4">
        <button
          type="button"
          className="cursor-pointer rounded px-4 py-2 text-lg text-blue-600 transition-colors hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
          onClick={reset}
        >
          {orbImage} Attempt to Escape {orbImage}
        </button>
        <Link
          href="/"
          prefetch={false}
          className="text-lg text-blue-600 transition-colors hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
        >
          {teleportImage} Teleport to the Dungeon Entrance {teleportImage}
        </Link>
      </div>
    </div>
  )
}

export default ErrorPage
