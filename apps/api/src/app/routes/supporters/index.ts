import axios from 'axios'
import dayjs from 'dayjs'
import { orderBy } from 'lodash-es'
import { AppType } from '~/app/app'
import { createCache } from '~/app/cache'
import { trackError } from '~/utils'

const token = process.env.BUYMEACOFFEE_TOKEN

export const supportersRoute = (
  app: AppType,
  { cache = createCache() }: { cache?: ReturnType<typeof createCache> } = {},
) => {
  app.get('/api/supporters/current', async (request, reply) => {
    if (!token) {
      return reply.status(404).send('Token ENV is not set')
    }

    const getData = async () => {
      const [subscriptionsResponse, supportersResponse] = await Promise.all([
        axios.get<SubscriptionsResponse>(
          'https://developers.buymeacoffee.com/api/v1/subscriptions',
          {
            params: {
              status: 'active',
              per_page: 100,
            },
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        ),
        axios.get<SupporterResponse>('https://developers.buymeacoffee.com/api/v1/supporters', {
          params: {
            per_page: 100,
          },
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
      ])

      const activeSubscriptions =
        'error' in subscriptionsResponse.data ? [] : subscriptionsResponse.data.data

      if ('error' in subscriptionsResponse.data) {
        trackError(new Error(subscriptionsResponse.data.error))
      }

      if ('error' in supportersResponse.data) {
        trackError(new Error(supportersResponse.data.error))

        return reply.status(500).send({
          error: supportersResponse.data.error,
        })
      }

      const supportersForLastMonth = supportersResponse.data.data
        .map((supporter) => {
          return {
            id: supporter.support_id,
            total: supporter.support_coffees * parseFloat(supporter.support_coffee_price),
            currency: supporter.support_currency,
            createdOn: supporter.support_created_on,
          }
        })
        .filter((supporter) => dayjs(supporter.createdOn).isAfter(dayjs().subtract(1, 'month')))

      const perMonthFromSubscriptions = activeSubscriptions.reduce((acc, subscription) => {
        const subscriptionStart = dayjs(subscription.subscription_current_period_start)
        const subscriptionEnd = dayjs(subscription.subscription_current_period_end)
        const subscriptionMonths = subscriptionEnd.diff(subscriptionStart, 'month')
        const subscriptionPrice = parseFloat(subscription.subscription_coffee_price)
        const total = subscriptionPrice / subscriptionMonths

        return acc + total
      }, 0)

      const totalFromSupporters = supportersForLastMonth.reduce(
        (acc, supporter) => acc + supporter.total,
        0,
      )

      return {
        total: Math.round((totalFromSupporters + perMonthFromSubscriptions) * 100) / 100,
        goal: 20,
      }
    }

    return cache.get({ key: request.routeOptions.url ?? request.url, loader: getData })
  })

  app.get('/api/supporters', async (request, reply) => {
    if (!token) {
      return reply.status(404).send('Token ENV is not set')
    }

    const getData = async () => {
      const [subscriptionsResponse, supportersResponse] = await Promise.all([
        axios.get<SubscriptionsResponse>(
          'https://developers.buymeacoffee.com/api/v1/subscriptions',
          {
            params: {
              status: 'active',
              per_page: 100,
            },
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        ),
        axios.get<SupporterResponse>('https://developers.buymeacoffee.com/api/v1/supporters', {
          params: {
            per_page: 100,
          },
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
      ])

      const activeSubscriptions =
        'error' in subscriptionsResponse.data ? [] : subscriptionsResponse.data.data

      if ('error' in subscriptionsResponse.data) {
        trackError(new Error(subscriptionsResponse.data.error))
      }

      if ('error' in supportersResponse.data) {
        trackError(new Error(supportersResponse.data.error))
        return reply.status(500).send({
          error: supportersResponse.data.error,
        })
      }

      const oneTimeDonations = supportersResponse.data.data
        .map((supporter) => ({
          id: String(supporter.support_id),
          type: 'one-time' as const,
          amount: supporter.support_coffees * parseFloat(supporter.support_coffee_price),
          currency: supporter.support_currency,
          createdAt: supporter.support_created_on,
          source: 'buymeacoffee',
        }))
        .concat([
          // Donations not tracked by BuyMeACoffee
          // Not many, so just hardcoding here
          {
            id: 'kofi-1',
            type: 'one-time' as const,
            amount: 50,
            currency: 'USD',
            createdAt: dayjs('2025-05-20').toISOString(),
            source: 'kofi',
          },
        ])

      const subscriptionDonations = activeSubscriptions.map((subscription) => ({
        id: subscription.subscription_id,
        type: 'subscription' as const,
        amount: parseFloat(subscription.subscription_coffee_price),
        currency: subscription.subscription_currency,
        createdAt: subscription.subscription_created_on,
        currentPeriodStart: subscription.subscription_current_period_start,
        currentPeriodEnd: subscription.subscription_current_period_end,
        isActiveNow: dayjs().isBefore(dayjs(subscription.subscription_current_period_end)),
        durationType: subscription.subscription_duration_type,
        source: 'buymeacoffee',
      }))

      return {
        oneTimeDonations: orderBy(oneTimeDonations, ['createdAt'], ['desc']),
        subscriptionDonations,
      }
    }

    return cache.get({ key: request.routeOptions.url ?? request.url, loader: getData })
  })
}

type SubscriptionsResponse =
  | {
      current_page: number
      data: SubscriptionData[]
      first_page_url: string
      from: number
      last_page: number
      last_page_url: string
      next_page_url: string
      path: string
      per_page: number
      prev_page_url: any
      to: number
      total: number
    }
  | {
      error: string
    }

type SubscriptionData = {
  subscription_id: number
  subscription_cancelled_on: null
  subscription_created_on: string
  subscription_updated_on: string
  subscription_current_period_start: string
  subscription_current_period_end: string
  subscription_coffee_price: string
  subscription_coffee_num: number
  subscription_is_cancelled: null
  subscription_is_cancelled_at_period_end: null
  subscription_currency: string
  subscription_message: string | null
  message_visibility: number
  subscription_duration_type: string
  referer: null
  country: null
  transaction_id: string
  payer_email: string
  payer_name: string
}

type SupporterResponse =
  | {
      current_page: number
      data: SupporterData[]
      first_page_url: string
      from: number
      last_page: number
      last_page_url: string
      next_page_url: any
      path: string
      per_page: number
      prev_page_url: any
      to: number
      total: number
    }
  | {
      error: string
    }

type SupporterData = {
  support_id: number
  support_note: string
  support_coffees: number
  transaction_id: string
  support_visibility: number
  support_created_on: string
  support_updated_on: string
  transfer_id: any
  supporter_name: string
  support_coffee_price: string
  support_email: any
  is_refunded: any
  support_currency: string
  support_type: number
  referer: any
  country: string
  order_payload: string
  support_hidden: number
  refunded_at: any
  payer_email: string
  payment_platform: string
  payer_name: string
}
