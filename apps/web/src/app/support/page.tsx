import { ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline'
import { Metadata } from 'next'
import { fetchApi } from '~/api/server'
import { sharedOGMetadata } from '~/app/shared-metadata'
import { Logo } from '~/components/Logo'
import { defaultMetaTitle } from '~/constants'
import { Donation, SupportersCurrentResponse, SupportersListResponse } from '~/types'
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
      <h4 className={cn('text-lg font-medium', titleColor)}>{title}</h4>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {displayedDonations.map((donation) => (
          <div
            key={`${showDurationType ? 'subscription' : 'onetime'}-${donation.id}`}
            className="border-border-strong bg-surface-muted rounded border p-3"
          >
            <div className="flex items-center justify-between gap-1">
              <span className="font-medium">{showDurationType ? 'Subscriber' : 'Supporter'}</span>
              <span className={cn('text-warning', donation.amount >= 10 && 'font-semibold')}>
                {donation.currency} {donation.amount.toFixed(2)}
              </span>
            </div>
            <div className="text-muted-foreground text-sm">
              {showDurationType && donation.durationType && <>{donation.durationType} • Since </>}
              <span suppressHydrationWarning>
                {new Date(donation.createdAt).toLocaleDateString()}
              </span>
            </div>
            {donation.isActiveNow && <div className="text-success mt-1 text-xs">Active</div>}
          </div>
        ))}
      </div>
      {remainingCount > 0 && (
        <p className="text-muted-foreground text-sm">... and {remainingCount} more supporters</p>
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
          <h2 className="text-page-heading flex items-center justify-center gap-3 text-3xl font-bold">
            Support DCSS Stats App
          </h2>
          <div className="text-muted-foreground">
            Help us keep the data crunching and the servers running
          </div>
          <div className="text-xl">
            Current monthly goal: <span className="text-warning">${data.total}</span> of{' '}
            <span className="text-warning">${data.goal}</span>
          </div>
        </div>
        <div className="border-border-strong space-y-4 rounded-sm border p-6">
          <div className="flex flex-col space-y-2">
            <h3 className="text-2xl leading-none font-semibold">Why Support Us?</h3>
            <p className="text-muted-foreground text-sm">Your support directly contributes to:</p>
          </div>
          <ul className="m-0 list-disc space-y-2 pl-6">
            <li>Server and infrastructure costs</li>
            <li>Development of new features and improvements to existing ones</li>
            <li>Maintenance and updates to keep everything running smoothly</li>
          </ul>
        </div>
        <div className="border-border-strong flex flex-col items-center justify-center gap-4 rounded-sm">
          <h3 className="text-2xl leading-none font-semibold">Methods</h3>
          {buyMeACoffeeUrl && (
            <a
              target="_blank"
              href={buyMeACoffeeUrl}
              rel="noreferrer"
              className="bg-brand-coffee text-on-light hover:bg-brand-coffee-hover flex items-center justify-center gap-2 rounded-full px-6 py-3 font-medium transition-all"
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
              className="bg-brand-github text-on-dark hover:bg-brand-github-hover flex items-center justify-center gap-2 rounded-full px-6 py-3 font-medium transition-all"
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
              className="bg-brand-kofi text-on-dark hover:bg-brand-kofi-hover flex items-center justify-center gap-2 rounded-full px-6 py-3 font-medium transition-all"
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
          <div className="border-border-strong space-y-4 rounded-sm border p-6">
            {listData.subscriptionDonations.length > 0 && (
              <DonationList
                donations={listData.subscriptionDonations}
                title="Subscribers"
                titleColor="text-warning"
                showDurationType={true}
              />
            )}

            {listData.oneTimeDonations.length > 0 && (
              <DonationList
                donations={listData.oneTimeDonations}
                title="Recent One-Time Donations"
                titleColor="text-info"
                maxItems={12}
              />
            )}
          </div>
        )}

        <div className="text-muted-foreground space-y-2 text-center">
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
