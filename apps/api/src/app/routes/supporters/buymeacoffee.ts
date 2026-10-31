import axios from 'axios'
import dayjs from 'dayjs'
import { uniqBy } from 'lodash-es'
import { Static, TSchema, Type } from 'typebox'
import { Value } from 'typebox/value'
import { trackError } from '~/utils'
import { SupportersData } from './types'

const subscriptionSchema = Type.Object({
  subscription_id: Type.Union([Type.Number(), Type.String()]),
  subscription_created_on: Type.String(),
  subscription_current_period_start: Type.String(),
  subscription_current_period_end: Type.String(),
  subscription_coffee_price: Type.String(),
  subscription_currency: Type.String(),
  subscription_duration_type: Type.String(),
})

const supporterSchema = Type.Object({
  support_id: Type.Number(),
  support_coffees: Type.Number(),
  support_coffee_price: Type.String(),
  support_currency: Type.String(),
  support_created_on: Type.String(),
})

const errorSchema = Type.Object({ error: Type.String() })

type CoffeeResponse<T> = { data: T[] } | { error: string }

async function fetchCoffeePages<T extends TSchema>(
  endpoint: 'subscriptions' | 'supporters',
  token: string,
  schema: T,
): Promise<CoffeeResponse<Static<T>>> {
  const pageSchema = Type.Object({
    data: Type.Array(schema),
    current_page: Type.Integer({ minimum: 1 }),
    last_page: Type.Integer({ minimum: 1 }),
  })
  const records: Static<T>[] = []

  // The API ignores per_page and currently returns five records per page.
  for (let page = 1; page <= 100; page++) {
    let data: unknown
    try {
      const response = await axios.get<unknown>(
        `https://developers.buymeacoffee.com/api/v1/${endpoint}`,
        {
          params: { page, ...(endpoint === 'subscriptions' ? { status: 'active' } : {}) },
          headers: { Authorization: `Bearer ${token}` },
          timeout: 15_000,
          maxRedirects: 0,
        },
      )
      data = response.data
    } catch {
      // Never forward Axios errors containing authorization headers.
      throw new Error('Buy Me a Coffee request failed')
    }

    if (Value.Check(errorSchema, data)) {
      if (page === 1) return data
      throw new Error('Buy Me a Coffee could not load the complete donation history')
    }
    if (!Value.Check(pageSchema, data) || data.current_page !== page || data.last_page < page) {
      throw new Error('Buy Me a Coffee returned an incomplete or invalid page')
    }
    records.push(...data.data)
    if (page === data.last_page) return { data: records }
  }

  throw new Error('Buy Me a Coffee exceeded the pagination limit')
}

export async function fetchCoffeeSupporters(token: string): Promise<SupportersData> {
  const [subscriptionsResponse, supportersResponse] = await Promise.all([
    fetchCoffeePages('subscriptions', token, subscriptionSchema),
    fetchCoffeePages('supporters', token, supporterSchema),
  ])

  const activeSubscriptions = 'error' in subscriptionsResponse ? [] : subscriptionsResponse.data
  if ('error' in subscriptionsResponse) {
    trackError(new Error(subscriptionsResponse.error))
  }
  if ('error' in supportersResponse) {
    throw new Error(supportersResponse.error)
  }

  return {
    oneTimeDonations: uniqBy(supportersResponse.data, 'support_id').map((supporter) => ({
      id: String(supporter.support_id),
      type: 'one-time',
      amount: supporter.support_coffees * parseFloat(supporter.support_coffee_price),
      currency: supporter.support_currency,
      createdAt: supporter.support_created_on,
      source: 'buymeacoffee',
    })),
    subscriptionDonations: uniqBy(activeSubscriptions, 'subscription_id').map((subscription) => ({
      id: subscription.subscription_id,
      type: 'subscription',
      amount: parseFloat(subscription.subscription_coffee_price),
      currency: subscription.subscription_currency,
      createdAt: subscription.subscription_created_on,
      currentPeriodStart: subscription.subscription_current_period_start,
      currentPeriodEnd: subscription.subscription_current_period_end,
      isActiveNow: dayjs().isBefore(dayjs(subscription.subscription_current_period_end)),
      durationType: subscription.subscription_duration_type,
      source: 'buymeacoffee',
    })),
  }
}
