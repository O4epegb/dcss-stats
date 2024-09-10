import axios from 'axios'
import dayjs from 'dayjs'
import { AppType } from '~/app/app'
import { cache, ttl } from '~/app/cache'

const tokenData = {
  token: '',
  expiresAt: dayjs(0),
}

const twClientId = process.env.TWITCH_CLIENT_ID
const twSecret = process.env.TWITCH_SECRET

export const streamsRoute = (app: AppType) => {
  app.get('/api/streams', async (request, reply) => {
    const cacheKey = request.routeOptions.url ?? request.url
    const cached = cache.get(cacheKey)

    if (!twClientId || !twSecret) {
      return reply.status(404).send('Twitch ENVs are not set')
    }

    const getData = async () => {
      if (tokenData.expiresAt.diff(dayjs(), 'seconds') <= 10) {
        console.log('fetching twitch token')

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

      const streams = res.data.data.map((stream) => ({
        username: stream.user_name,
        login: stream.user_login,
        viewers: stream.viewer_count,
        thumbnail: stream.thumbnail_url,
      }))

      return {
        data: {
          streams: streams.slice(0, 6),
        },
      }
    }

    if (!cached || Date.now() - cached.ttl > ttl) {
      cache.set(cacheKey, { promise: getData(), ttl: Date.now() })
    }

    return cache.get(cacheKey)?.promise
  })
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
