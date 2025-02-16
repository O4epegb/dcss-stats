import { fetchApi } from '~/api/server'
import { Logo } from '~/components/Logo'
import { SupportersCurrentResponse } from '~/types'

export const revalidate = 30

const SupportPage = async () => {
  const res = await fetchApi('/supporters/current')
  const data: SupportersCurrentResponse = await res.json()

  if (!res.ok) {
    throw res
  }

  return (
    <div className="container mx-auto flex min-h-screen flex-col items-center space-y-4 py-4 pt-4">
      <header>
        <Logo />
      </header>

      <div className="mx-auto max-w-3xl space-y-8 px-4 pt-0 md:pt-8">
        <div className="space-y-4 text-center">
          <h2 className="flex items-center justify-center gap-3 text-3xl font-bold">
            Support DCSS Stats App
          </h2>
          <div className="text-zinc-500 dark:text-zinc-400">
            Help us keep the data crunching and the servers running
          </div>
          <div className="text-xl">
            Current monthly goal:{' '}
            <span className="text-amber-500 dark:text-amber-400">${data.total}</span> of{' '}
            <span className="text-amber-500 dark:text-amber-400">${data.goal}</span>
          </div>
        </div>
        <div className="space-y-4 rounded border border-zinc-500 p-6">
          <div className="flex flex-col space-y-2">
            <h3 className="text-2xl font-semibold leading-none">Why Support Us?</h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Your support directly contributes to:
            </p>
          </div>
          <ul className="m-0 list-disc space-y-2 pl-6">
            <li>Server and infrastructure costs</li>
            <li>Development of new features and improvements to existing ones</li>
            <li>Maintenance and updates to keep everything running smoothly</li>
          </ul>
        </div>
        <div className="flex flex-col items-center justify-center gap-4 rounded border-zinc-500">
          <h3 className="text-2xl font-semibold leading-none">Methods</h3>
          <div>
            <a
              target="_blank"
              href="https://www.buymeacoffee.com/totalnoob"
              rel="noreferrer"
              className="block w-full rounded-full bg-[#ffdd00] px-6 py-3 font-medium text-black transition-all hover:bg-[#ffc800]"
            >
              Support on <b>Buy Me a Coffee</b>
            </a>
          </div>
        </div>
        <div className="space-y-2 text-center text-zinc-500 dark:text-zinc-400">
          <p>Thank you for your contribution!</p>
          <p className="text-sm">
            Code source on{' '}
            <a className="font-bold hover:underline" href="https://github.com/O4epegb/dcss-stats">
              GitHub
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}

export default SupportPage
