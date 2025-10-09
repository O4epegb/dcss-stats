import Link from 'next/link'

export const Logo = () => {
  return (
    <Link className="inline-flex items-center space-x-2" href="/">
      <img alt="App logo" width="128" height="128" src="/logo.png" className="h-8 w-8" />
      <h1 className="text-center text-2xl whitespace-nowrap sm:text-4xl">DCSS Stats</h1>
    </Link>
  )
}
