import axios from 'axios'
import dayjs from 'dayjs'
import { random, range } from 'lodash-es'
import { AppType } from '~/app/app'
import { createCache, type CacheManager } from '~/app/cache'
import { logger } from '~/utils'

const tokenData = {
  token: '',
  expiresAt: dayjs(0),
}

const twClientId = process.env.TWITCH_CLIENT_ID
const twSecret = process.env.TWITCH_SECRET

const getMockedSteams = (): Stream[] =>
  range(random(1, 10)).map((index) => ({
    username: `Mocked User ${index}`,
    login: 'twitch',
    viewers: random(1, 100),
    thumbnail: 'https://placehold.co/640x360',
  }))

type StreamsRouteOptions = {
  cache?: CacheManager
}

export const streamsRoute = (
  app: AppType,
  { cache = createCache({ revalidate: 5 * 60 }) }: StreamsRouteOptions = {},
) => {
  app.get('/api/streams', async (request, reply) => {
    if (!twClientId || !twSecret) {
      if (process.env.NODE_ENV !== 'production') {
        return {
          data: {
            streams: getMockedSteams(),
          },
        }
      }

      return reply.status(404).send('Twitch ENVs are not set')
    }

    const getData = async () => {
      if (tokenData.expiresAt.diff(dayjs(), 'seconds') <= 10) {
        logger('fetching twitch token')

        const res = await axios.post<TwitchOauthResponse>('https://id.twitch.tv/oauth2/token', {
          client_id: twClientId,
          client_secret: twSecret,
          grant_type: 'client_credentials',
        })

        tokenData.expiresAt = dayjs().add(res.data.expires_in, 'ms')
        tokenData.token = res.data.access_token
      }

      const res = await axios.get<TwitchStreamsResponse>('https://api.twitch.tv/helix/streams', {
        params: {
          game_id: 27643,
          type: 'live',
        },
        headers: {
          Authorization: `Bearer ${tokenData.token}`,
          'Client-Id': twClientId,
        },
      })

      const streams: Stream[] = res.data.data.map((stream) => ({
        username: stream.user_name,
        login: stream.user_login,
        viewers: stream.viewer_count,
        thumbnail: stream.thumbnail_url,
      }))

      if (streams.length === 0 && process.env.NODE_ENV !== 'production') {
        streams.push(...getMockedSteams())
      }

      return {
        data: {
          streams: streams.slice(0, 10),
        },
      }
    }

    return cache.get({ key: request.routeOptions.url ?? request.url, loader: getData })
  })
}

type Stream = {
  username: string
  login: string
  viewers: number
  thumbnail: string
}

type TwitchStreamsResponse = {
  data: Array<{
    id: string
    user_id: string
    user_login: string
    user_name: string
    game_id: string
    game_name: string
    type: string
    title: string
    tags: string[]
    viewer_count: number
    started_at: string
    language: string
    thumbnail_url: string
    tag_ids: unknown[]
    is_mature: boolean
  }>
  pagination: {
    cursor: string
  }
}

type TwitchOauthResponse = {
  access_token: string
  expires_in: number
  token_type: string
}
