import { ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline'
import { Metadata } from 'next'
import { fetchApi } from '~/api/server'
import { sharedOGMetadata } from '~/app/shared-metadata'
import { Logo } from '~/components/Logo'
import { defaultMetaTitle } from '~/constants'
import { SupportersCurrentResponse, SupportersListResponse, Donation } from '~/types'
import { cn } from '~/utils'
import { BitcoinBlock } from './BitcoinBlock'

const title = `Support Us | ${defaultMetaTitle}`

interface DonationListProps {
  donations: Donation[]
  title: string
  titleColor: string
  maxItems?: number
  showDurationType?: boolean
}

const DonationList = ({
  donations,
  title,
  titleColor,
  maxItems,
  showDurationType = false,
}: DonationListProps) => {
  const displayedDonations = maxItems ? donations.slice(0, maxItems) : donations
  const remainingCount = maxItems && donations.length > maxItems ? donations.length - maxItems : 0

  return (
    <div className="space-y-3">
      <h4 className={`text-lg font-medium ${titleColor}`}>{title}</h4>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {displayedDonations.map((donation) => (
          <div
            key={`${showDurationType ? 'subscription' : 'onetime'}-${donation.id}`}
            className="rounded border border-zinc-600 bg-zinc-50 p-3 dark:bg-zinc-800"
          >
            <div className="flex items-center justify-between gap-1">
              <span className="font-medium">{showDurationType ? 'Subscriber' : 'Supporter'}</span>
              <span
                className={cn(
                  'text-amber-500 dark:text-amber-400',
                  donation.amount >= 10 && 'font-semibold',
                )}
              >
                {donation.currency} {donation.amount.toFixed(2)}
              </span>
            </div>
            <div className="text-sm text-zinc-500 dark:text-zinc-400">
              {showDurationType && donation.durationType && <>{donation.durationType} • Since </>}
              <span suppressHydrationWarning>
                {new Date(donation.createdAt).toLocaleDateString()}
              </span>
            </div>
            {donation.isActiveNow && (
              <div className="mt-1 text-xs text-green-600 dark:text-green-400">Active</div>
            )}
          </div>
        ))}
      </div>
      {remainingCount > 0 && (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          ... and {remainingCount} more supporters
        </p>
      )}
    </div>
  )
}

export const metadata: Metadata = {
  title,
  openGraph: {
    ...sharedOGMetadata,
    title,
  },
}

const btcWallet = process.env.NEXT_PUBLIC_BITCOIN_WALLET
const buyMeACoffeeUrl = process.env.NEXT_PUBLIC_BUY_ME_A_COFFEE_URL
const githubSponsorUrl = process.env.NEXT_PUBLIC_GITHUB_SPONSOR_URL
const kofiUrl = process.env.NEXT_PUBLIC_KOFI_URL

const SupportPage = async () => {
  const res = await fetchApi('/supporters/current')
  const listRes = await fetchApi('/supporters')

  if (!res.ok || !listRes.ok) {
    throw res
  }

  const data: SupportersCurrentResponse = await res.json()
  const listData: SupportersListResponse = await listRes.json()

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
        <div className="space-y-4 rounded-sm border border-zinc-500 p-6">
          <div className="flex flex-col space-y-2">
            <h3 className="text-2xl leading-none font-semibold">Why Support Us?</h3>
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
        <div className="flex flex-col items-center justify-center gap-4 rounded-sm border-zinc-500">
          <h3 className="text-2xl leading-none font-semibold">Methods</h3>
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

        {(listData.oneTimeDonations.length > 0 || listData.subscriptionDonations.length > 0) && (
          <div className="space-y-4 rounded-sm border border-zinc-500 p-6">
            {listData.subscriptionDonations.length > 0 && (
              <DonationList
                donations={listData.subscriptionDonations}
                title="Subscribers"
                titleColor="text-amber-500 dark:text-amber-400"
                showDurationType={true}
              />
            )}

            {listData.oneTimeDonations.length > 0 && (
              <DonationList
                donations={listData.oneTimeDonations}
                title="Recent One-Time Donations"
                titleColor="text-blue-500 dark:text-blue-400"
                maxItems={12}
              />
            )}
          </div>
        )}

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
