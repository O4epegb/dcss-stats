import { ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline'
import { Metadata } from 'next'
import { Logo } from '~/components/Logo'
import { defaultMetaTitle, rootUrl } from '~/constants'
import { SupportersCurrentResponse } from '~/types'
import { BitcoinBlock } from './BitcoinBlock'

export const metadata: Metadata = {
  title: `Support Us | ${defaultMetaTitle}`,
}

const btcWallet = process.env.NEXT_PUBLIC_BITCOIN_WALLET
const buyMeACoffeeUrl = process.env.NEXT_PUBLIC_BUY_ME_A_COFFEE_URL
const githubSponsorUrl = process.env.NEXT_PUBLIC_GITHUB_SPONSOR_URL
const kofiUrl = process.env.NEXT_PUBLIC_KOFI_URL

const SupportPage = async () => {
  const res = await fetch(`${rootUrl}/api/supporters/current`, {
    next: { revalidate: 300 },
    cache: 'force-cache',
  })
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
          {buyMeACoffeeUrl && (
            <a
              target="_blank"
              href={buyMeACoffeeUrl}
              rel="noreferrer"
              className="flex items-center justify-center gap-2 rounded-full bg-[#ffdd00] px-6 py-3 font-medium text-black transition-all hover:bg-[#ffc800]"
            >
              <span>
                Support on <b>Buy Me a Coffee</b>
              </span>{' '}
              <ArrowTopRightOnSquareIcon className="size-5" />
            </a>
          )}
          {githubSponsorUrl && (
            <a
              target="_blank"
              href={githubSponsorUrl}
              rel="noreferrer"
              className="flex items-center justify-center gap-2 rounded-full bg-[#24292e] px-6 py-3 font-medium text-white transition-all hover:bg-[#1b1f23]"
            >
              <span>
                Sponsor on <b>GitHub</b>
              </span>{' '}
              <ArrowTopRightOnSquareIcon className="size-5" />
            </a>
          )}
          {kofiUrl && (
            <a
              target="_blank"
              href={kofiUrl}
              rel="noreferrer"
              className="flex items-center justify-center gap-2 rounded-full bg-[#29abe0] px-6 py-3 font-medium text-white transition-all hover:bg-[#3b9fc6]"
            >
              <span>
                Support on <b>Ko-fi</b>
              </span>{' '}
              <ArrowTopRightOnSquareIcon className="size-5" />
            </a>
          )}
          {btcWallet && <BitcoinBlock wallet={btcWallet} />}
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
