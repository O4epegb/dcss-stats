import Link from 'next/link'

const Page404 = () => {
  const abyssImage = (
    <img
      width={32}
      height={32}
      src="/exit_abyss.png"
      alt="Exit the Abyss"
      className="inline-block size-6"
    />
  )

  return (
    <div className="flex h-screen flex-col items-center justify-center p-4 text-center font-mono">
      <h1 className="mb-4 flex items-center justify-center gap-4 text-6xl text-red-500">
        <img width={32} height={32} src="/dragon_form_octopode.png" alt="" className="size-10" />
        404
        <img width={32} height={32} src="/lich_form_octopode.png" alt="" className="size-10" />
      </h1>
      <p className="mb-2 text-xl">* The page you were looking for has vanished into the Abyss. *</p>
      <p className="mb-8 text-base italic text-gray-600 dark:text-gray-400">
        You feel a terrible presence watching...
      </p>
      <Link
        href="/"
        prefetch={false}
        className="text-lg text-blue-600 transition-colors hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
      >
        {abyssImage} Return to the Dungeon {abyssImage}
      </Link>
    </div>
  )
}

export default Page404
