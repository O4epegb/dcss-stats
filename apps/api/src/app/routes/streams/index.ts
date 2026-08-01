import axios from 'axios'
import dayjs from 'dayjs'
import { orderBy, random, range } from 'lodash-es'
import { AppType } from '~/app/app'
import { createCache, type CacheManager } from '~/app/cache'
import { logger } from '~/utils'

const STREAM_LIMIT = 10
const TWITCH_GAME_ID = 27643
const YOUTUBE_SEARCH_QUERY = 'Dungeon Crawl Stone Soup|DCSS'
const YOUTUBE_SEARCH_CACHE_SECONDS = 20 * 60

const tokenData = {
  token: '',
  expiresAt: dayjs(0),
}

const twitchClientId = process.env.TWITCH_CLIENT_ID
const twitchSecret = process.env.TWITCH_SECRET
const youtubeApiKey = process.env.YOUTUBE_API_KEY

const getMockedStreams = (): Stream[] =>
  range(random(1, STREAM_LIMIT)).map((index) => ({
    id: `mock:${index}`,
    platform: 'twitch',
    username: `Mocked User ${index}`,
    viewers: random(1, 100),
    thumbnail: 'https://placehold.co/640x360',
    url: 'https://www.twitch.tv/twitch',
  }))

type StreamsRouteOptions = {
  twitchCache?: CacheManager
  youtubeCache?: CacheManager
  youtubeSearchCache?: CacheManager
}

export const streamsRoute = (
  app: AppType,
  {
    twitchCache = createCache(),
    youtubeCache = createCache(),
    youtubeSearchCache = createCache({ revalidate: YOUTUBE_SEARCH_CACHE_SECONDS }),
  }: StreamsRouteOptions = {},
) => {
  app.get('/api/streams', async (_request, reply) => {
    const providers: Array<Promise<Stream[]>> = []

    if (twitchClientId && twitchSecret) {
      providers.push(
        getCachedProviderStreams({
          cache: twitchCache,
          key: 'streams:twitch',
          provider: 'Twitch',
          loader: () => getTwitchStreams(twitchClientId, twitchSecret),
        }),
      )
    }

    if (youtubeApiKey) {
      providers.push(
        getCachedProviderStreams({
          cache: youtubeCache,
          key: 'streams:youtube',
          provider: 'YouTube',
          loader: () => getYoutubeStreams(youtubeApiKey, youtubeSearchCache),
        }),
      )
    }

    if (providers.length === 0) {
      if (process.env.NODE_ENV === 'development') {
        return {
          data: {
            streams: getMockedStreams(),
          },
        }
      }

      return reply.status(404).send('Stream provider ENVs are not set')
    }

    const allStreams = (await Promise.all(providers)).flat()
    const streams = orderBy(allStreams, (stream) => stream.viewers ?? 0, 'desc').slice(
      0,
      STREAM_LIMIT,
    )

    if (streams.length === 0 && process.env.NODE_ENV === 'development') {
      streams.push(...getMockedStreams())
    }

    return {
      data: {
        streams,
      },
    }
  })
}

const getCachedProviderStreams = ({
  cache,
  key,
  provider,
  loader,
}: {
  cache: CacheManager
  key: string
  provider: string
  loader: () => Promise<Stream[]>
}) =>
  cache.get({
    key,
    loader: async () => {
      try {
        return await loader()
      } catch (error) {
        logProviderError(provider, error)
        return []
      }
    },
  })

const getTwitchStreams = async (clientId: string, secret: string): Promise<Stream[]> => {
  if (tokenData.expiresAt.diff(dayjs(), 'seconds') <= 10) {
    logger('fetching twitch token')

    const res = await axios.post<TwitchOauthResponse>('https://id.twitch.tv/oauth2/token', {
      client_id: clientId,
      client_secret: secret,
      grant_type: 'client_credentials',
    })

    tokenData.expiresAt = dayjs().add(res.data.expires_in, 'seconds')
    tokenData.token = res.data.access_token
  }

  const res = await axios.get<TwitchStreamsResponse>('https://api.twitch.tv/helix/streams', {
    params: {
      game_id: TWITCH_GAME_ID,
      type: 'live',
    },
    headers: {
      Authorization: `Bearer ${tokenData.token}`,
      'Client-Id': clientId,
    },
  })

  return res.data.data.map((stream) => ({
    id: `twitch:${stream.id}`,
    platform: 'twitch',
    username: stream.user_name,
    viewers: stream.viewer_count,
    thumbnail: stream.thumbnail_url,
    url: `https://www.twitch.tv/${stream.user_login}`,
  }))
}

const getYoutubeStreams = async (apiKey: string, searchCache: CacheManager): Promise<Stream[]> => {
  const videoIds = await searchCache.get({
    key: 'streams:youtube:search',
    loader: async () => {
      try {
        const res = await axios.get<YoutubeSearchResponse>(
          'https://www.googleapis.com/youtube/v3/search',
          {
            params: {
              part: 'snippet',
              type: 'video',
              eventType: 'live',
              q: YOUTUBE_SEARCH_QUERY,
              videoCategoryId: 20,
              order: 'viewCount',
              maxResults: 25,
            },
            headers: {
              'X-Goog-Api-Key': apiKey,
            },
          },
        )

        return res.data.items.map((item) => item.id.videoId)
      } catch (error) {
        logProviderError('YouTube search', error)
        return []
      }
    },
  })

  if (videoIds.length === 0) {
    return []
  }

  const res = await axios.get<YoutubeVideosResponse>(
    'https://www.googleapis.com/youtube/v3/videos',
    {
      params: {
        part: 'snippet,liveStreamingDetails',
        id: videoIds.join(','),
      },
      headers: {
        'X-Goog-Api-Key': apiKey,
      },
    },
  )

  return res.data.items
    .filter((video) => video.snippet.liveBroadcastContent === 'live' && isDcssVideo(video))
    .map((video) => ({
      id: `youtube:${video.id}`,
      platform: 'youtube' as const,
      username: video.snippet.channelTitle,
      viewers: parseViewerCount(video.liveStreamingDetails?.concurrentViewers),
      thumbnail: getYoutubeThumbnail(video),
      url: `https://www.youtube.com/watch?v=${video.id}`,
    }))
}

const isDcssVideo = (video: YoutubeVideo) => {
  const searchableText = [
    video.snippet.title,
    video.snippet.description,
    video.snippet.channelTitle,
    ...(video.snippet.tags ?? []),
  ].join(' ')

  return /\bdcss\b|dungeon crawl stone soup/i.test(searchableText)
}

const getYoutubeThumbnail = (video: YoutubeVideo) =>
  video.snippet.thumbnails.maxres?.url ??
  video.snippet.thumbnails.standard?.url ??
  video.snippet.thumbnails.high?.url ??
  video.snippet.thumbnails.medium?.url ??
  video.snippet.thumbnails.default?.url ??
  `https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`

const parseViewerCount = (value?: string) => {
  if (value === undefined) {
    return null
  }

  const viewers = Number.parseInt(value, 10)
  return Number.isNaN(viewers) ? null : viewers
}

const logProviderError = (provider: string, error: unknown) => {
  const message = error instanceof Error ? error.message : 'Unknown error'
  logger(`streams: ${provider} request failed: ${message}`)
}

type Stream = {
  id: string
  platform: 'twitch' | 'youtube'
  username: string
  viewers: number | null
  thumbnail: string
  url: string
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

type YoutubeSearchResponse = {
  items: Array<{
    id: {
      videoId: string
    }
  }>
}

type YoutubeVideosResponse = {
  items: YoutubeVideo[]
}

type YoutubeVideo = {
  id: string
  snippet: {
    title: string
    description: string
    channelTitle: string
    tags?: string[]
    liveBroadcastContent: 'live' | 'none' | 'upcoming'
    thumbnails: Partial<
      Record<'default' | 'medium' | 'high' | 'standard' | 'maxres', { url: string } | undefined>
    >
  }
  liveStreamingDetails?: {
    concurrentViewers?: string
  }
}
