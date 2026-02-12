import { constants, createInflateRaw, type InflateRaw } from 'node:zlib'
import { orderBy, uniq } from 'lodash-es'
import { Static, Type } from 'typebox'
import { AppType } from '~/app/app'
import { createCache, type CacheManager } from '~/app/cache'
import { prisma } from '~/prisma'
import { logger, trackError } from '~/utils'
import { trunkGameVersion } from '../../../../prisma/seedData'

interface LobbyEntry {
  msg?: string
  id: number
  username: string
  spectator_count: number
  idle_time: number
  game_id: string
  xl?: string
  char?: string
  place?: string
  turn?: string
  dur?: string
  god?: string
  title?: string
  milestone: string
}

type LiveGame = LobbyEntry & {
  server: string
}

type LiveGameWithPlayerStats = Omit<LiveGame, 'xl' | 'turn' | 'dur'> & {
  xl: number | null
  turn: number | null
  duration: number | null
  totalWins: number
  totalGames: number
  watchUrl: string
}

const zlibTail = Buffer.from([0x00, 0x00, 0xff, 0xff])

const toSocketUrl = (url: string) => {
  const trimmed = url.replace(/\/+$/, '')
  const withSocket = trimmed.endsWith('/socket') ? trimmed : `${trimmed}/socket`

  if (withSocket.startsWith('wss://') || withSocket.startsWith('ws://')) {
    return withSocket
  }

  if (withSocket.startsWith('https://')) {
    return `wss://${withSocket.slice('https://'.length)}`
  }

  if (withSocket.startsWith('http://')) {
    return `ws://${withSocket.slice('http://'.length)}`
  }

  return `wss://${withSocket}`
}

const inflateWithContext = (inflater: InflateRaw, raw: Buffer) =>
  new Promise<string | null>((resolve) => {
    const chunks: Buffer[] = []

    const onData = (chunk: Buffer) => {
      chunks.push(chunk)
    }

    const onError = () => {
      cleanup()
      resolve(null)
    }

    const cleanup = () => {
      inflater.off('data', onData)
      inflater.off('error', onError)
    }

    inflater.on('data', onData)
    inflater.on('error', onError)

    inflater.write(raw)
    inflater.write(zlibTail)
    inflater.flush(constants.Z_SYNC_FLUSH, () => {
      cleanup()
      resolve(chunks.length > 0 ? Buffer.concat(chunks).toString('utf8') : null)
    })
  })

const decodePayload = async (inflater: InflateRaw, payload: unknown) => {
  if (typeof payload === 'string') {
    return payload
  }

  const raw =
    payload instanceof ArrayBuffer
      ? Buffer.from(payload)
      : Buffer.isBuffer(payload)
        ? payload
        : payload &&
            typeof payload === 'object' &&
            typeof (payload as { arrayBuffer?: () => Promise<ArrayBuffer> }).arrayBuffer ===
              'function'
          ? Buffer.from(await (payload as Blob).arrayBuffer())
          : Buffer.from(String(payload))

  const decompressed = await inflateWithContext(inflater, raw)
  return decompressed ?? raw.toString('utf8')
}

const parseMessages = (raw: string): LobbyEntry[] => {
  try {
    const parsed = JSON.parse(raw) as { msgs?: LobbyEntry[] }
    return Array.isArray(parsed.msgs) ? parsed.msgs : [parsed as LobbyEntry]
  } catch {
    return []
  }
}

const fetchLobbyEntries = async (serverAbbr: string, url: string) =>
  new Promise<LiveGame[]>((resolve) => {
    const socketUrl = toSocketUrl(url)
    const ws = new WebSocket(socketUrl)
    const inflater = createInflateRaw({
      flush: constants.Z_SYNC_FLUSH,
      finishFlush: constants.Z_SYNC_FLUSH,
    })

    const entries: LiveGame[] = []
    let finished = false
    let decodeQueue = Promise.resolve()

    const finish = () => {
      clearTimeout(timeout)

      if (finished) {
        return
      }

      finished = true

      if (ws.readyState !== WebSocket.CLOSED && ws.readyState !== WebSocket.CLOSING) {
        ws.close()
      } else {
        trackError(new Error(`live-games: ${serverAbbr} socket already closed before finish`))
      }

      resolve(entries)
    }

    const timeout = setTimeout(() => {
      logger(`live-games: ${serverAbbr} timed out`)
      trackError(new Error(`live-games: ${serverAbbr} timed out`))
      finish()
    }, 12_000)

    ws.addEventListener('message', (event: { data: unknown }) => {
      const payload = event.data

      decodeQueue = decodeQueue
        .then(async () => {
          const decoded = await decodePayload(inflater, payload)
          const messages = parseMessages(decoded)

          for (const message of messages) {
            if (message.msg === 'lobby_entry') {
              const { msg, ...rest } = message
              entries.push({
                ...rest,
                server: serverAbbr,
              })
            }

            if (message.msg === 'lobby_complete') {
              finish()
            }
          }
        })
        .catch((error) => {
          logger(`live-games: ${serverAbbr} decode error ${String(error)}`)
          trackError(error)
        })
    })

    ws.addEventListener('close', () => {
      finish()
    })

    ws.addEventListener('error', (event) => {
      logger(`live-games: ${serverAbbr} socket error ${event.message}`)
      trackError(new Error(`live-games: ${serverAbbr} socket error ${event.message}`))
      finish()
    })
  })

export const liveGamesRoute = (
  app: AppType,
  {
    cache = createCache({ revalidate: 300, expire: 600 }),
  }: {
    cache?: CacheManager
  } = {},
) => {
  const Querystring = Type.Object({
    server: Type.Optional(Type.String()),
  })

  app.get<{
    Querystring: Static<typeof Querystring>
  }>(
    '/api/live-games',
    {
      schema: {
        querystring: Querystring,
      },
    },
    async (request) => {
      const { server: serverFilter } = request.query

      const load = async () => {
        const servers = await prisma.server.findMany({
          where: {
            isDormant: false,
            logfile: {
              some: {
                version: `0.${trunkGameVersion}`,
              },
            },
            ...(serverFilter
              ? { abbreviation: { equals: serverFilter, mode: 'insensitive' } }
              : {}),
          },
        })

        const watchUrlByServer = new Map(servers.map((server) => [server.abbreviation, server.url]))

        const results = await Promise.allSettled(
          servers.map((server) => fetchLobbyEntries(server.abbreviation, server.url)),
        )

        const parsedGames = results
          .flatMap((result) => (result.status === 'fulfilled' ? result.value : []))
          .filter((game) => game.username !== 'CNCPublicChat')
          .map(({ xl, turn, dur, ...rest }) => ({
            ...rest,
            xl: xl ? Number(xl) : null,
            turn: turn ? Number(turn) : null,
            duration: dur ? Number(dur) : null,
          }))

        let games: LiveGameWithPlayerStats[] = orderBy(
          parsedGames.map((game) => ({
            ...game,
            totalWins: 0,
            totalGames: 0,
            watchUrl: new URL(
              `/#watch-${game.username}`,
              watchUrlByServer.get(game.server) ?? '',
            ).toString(),
          })),
          [(g) => Boolean(g.xl), (g) => g.idle_time, (g) => g.spectator_count, (g) => g.xl],
          ['desc', 'asc', 'desc', 'desc'],
        ).slice(0, 10)

        const playerIds = uniq(games.map((game) => game.username.toLowerCase()))

        if (playerIds.length > 0) {
          const [gamesByPlayer, winsByPlayer] = await Promise.all([
            prisma.game.groupBy({
              by: ['playerId'],
              where: {
                playerId: {
                  in: playerIds,
                },
              },
              _count: {
                _all: true,
              },
            }),
            prisma.game.groupBy({
              by: ['playerId'],
              where: {
                playerId: {
                  in: playerIds,
                },
                isWin: true,
              },
              _count: {
                isWin: true,
              },
            }),
          ])

          const totalGamesByPlayer = new Map(
            gamesByPlayer.map((row) => [row.playerId, row._count._all]),
          )

          const totalWinsByPlayer = new Map(
            winsByPlayer.map((row) => [row.playerId, row._count.isWin]),
          )

          games = games.map((game) => ({
            ...game,
            totalWins: totalWinsByPlayer.get(game.username.toLowerCase()) ?? 0,
            totalGames: totalGamesByPlayer.get(game.username.toLowerCase()) ?? 0,
          }))
        }

        return {
          data: {
            updatedAt: new Date().toISOString(),
            allGamesTotal: parsedGames.length,
            games,
          },
        }
      }

      return cache.get({ key: request.url, loader: load })
    },
  )
}
