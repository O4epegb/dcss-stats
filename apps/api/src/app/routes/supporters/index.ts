import axios from 'axios'
import dayjs from 'dayjs'
import { AppType } from '~/app/app'
import { cache, ttl } from '~/app/cache'

const token = process.env.BUYMEACOFFEE_TOKEN

export const supportersRoute = (app: AppType) => {
  app.get('/api/supporters/current', async (request, reply) => {
    const cacheKey = request.routeOptions.url ?? request.url
    const cached = cache.get(cacheKey)

    if (!token) {
      return reply.status(404).send('Token ENV is not set')
    }

    const getData = async () => {
      // const subscriptionsResponse = await axios.get<SubscriptionsResponse>(
      //   'https://developers.buymeacoffee.com/api/v1/subscriptions',
      //   {
      //     params: {
      //       status: 'active',
      //       per_page: 100,
      //     },
      //     headers: {
      //       Authorization: `Bearer ${token}`,
      //     },
      //   },
      // )

      // const activeSubscriptions = 'error' in subscriptionsResponse.data ? [] : subscriptionsResponse.data.data

      const supportersResponse = await axios.get<SupporterResponse>(
        'https://developers.buymeacoffee.com/api/v1/supporters',
        {
          params: {
            per_page: 100,
          },
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      if ('error' in supportersResponse.data) {
        return reply.status(500).send({
          error: supportersResponse.data.error,
        })
      }

      const supportersForCurrentMonth = supportersResponse.data.data
        .map((supporter) => {
          return {
            id: supporter.support_id,
            total: supporter.support_coffees * parseFloat(supporter.support_coffee_price),
            currency: supporter.support_currency,
            createdOn: supporter.support_created_on,
          }
        })
        .filter((supporter) => dayjs(supporter.createdOn).isAfter(dayjs().startOf('month')))

      return {
        total: supportersForCurrentMonth.reduce((acc, supporter) => acc + supporter.total, 0),
        goal: 20,
      }
    }

    if (!cached || Date.now() - cached.ttl > ttl) {
      cache.set(cacheKey, { promise: getData(), ttl: Date.now() })
    }

    return cache.get(cacheKey)?.promise
  })
}

// type SubscriptionsResponse =
//   | {
//       current_page: number
//       data: SubscriptionData[]
//       first_page_url: string
//       from: number
//       last_page: number
//       last_page_url: string
//       next_page_url: string
//       path: string
//       per_page: number
//       prev_page_url: any
//       to: number
//       total: number
//     }
//   | {
//       error: string
//     }

// type SubscriptionData = {
//   subscription_id: number
//   subscription_cancelled_on: any
//   subscription_created_on: string
//   subscription_updated_on: string
//   subscription_current_period_start: string
//   subscription_current_period_end: string
//   subscription_coffee_price: string
//   subscription_coffee_num: number
//   subscription_is_cancelled: any
//   subscription_is_cancelled_at_period_end: any
//   subscription_currency: string
//   subscription_message: any
//   message_visibility: number
//   subscription_duration_type: string
//   referer: any
//   country: any
//   transaction_id: string
//   payer_email: string
//   payer_name: string
// }

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
