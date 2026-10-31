export type Donation = {
  id: number | string
  type: 'one-time' | 'subscription'
  source: 'buymeacoffee' | 'github' | 'kofi' | 'bitcoin'
  amount: number
  currency: string
  createdAt: string
  currentPeriodStart?: string
  currentPeriodEnd?: string
  isActiveNow?: boolean
  durationType?: string
}

export type SupportersData = {
  oneTimeDonations: Donation[]
  subscriptionDonations: Donation[]
}
