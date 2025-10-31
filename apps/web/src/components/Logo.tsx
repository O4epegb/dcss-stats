import Image from 'next/image'
import Link from 'next/link'

export const Logo = () => {
  return (
    <Link className="inline-flex items-center space-x-2" href="/">
      <Image
        priority
        alt="DCSS Stats app logo"
        width="128"
        height="128"
        src="/logo.png"
        className="size-8"
        quality={100}
      />
      <h1 className="text-center text-2xl whitespace-nowrap sm:text-4xl">DCSS Stats</h1>
    </Link>
  )
}
