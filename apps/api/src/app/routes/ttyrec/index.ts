import dayjs from 'dayjs'
import PQueue from 'p-queue'
import { Static, Type } from 'typebox'
import { AppType } from '~/app/app'
import {
  decodeTtyrecFromUrl,
  extractTimestampDataFromUrl,
  getTtyrecBufferFromUrl,
} from '~/app/utils/ttyrec'
import { prisma } from '~/prisma'

const REQUEST_INTERVAL_MS = 5000
const queuesByServerAbbr = new Map<string, PQueue>()
const serverAbbrByHost = new Map<string, string>()

const getQueueByServerAbbr = (serverAbbr: string) => {
  const normalizedServerAbbr = serverAbbr.toLowerCase()
  const queue = queuesByServerAbbr.get(normalizedServerAbbr)

  if (queue) {
    return queue
  }

  const nextQueue = new PQueue({
    concurrency: 1,
    intervalCap: 1,
    interval: REQUEST_INTERVAL_MS,
    carryoverConcurrencyCount: true,
  })

  queuesByServerAbbr.set(normalizedServerAbbr, nextQueue)

  return nextQueue
}

const queueRequestByServerAbbr = async <T>(serverAbbr: string, task: () => Promise<T>) => {
  const result = await getQueueByServerAbbr(serverAbbr).add(task)

  if (result === undefined) {
    throw new Error('Request queue task completed without a result')
  }

  return result
}

const resolveServerAbbrFromUrl = async (url: string) => {
  let requestHost = ''

  try {
    requestHost = new URL(url).hostname.toLowerCase()
  } catch {
    return null
  }

  const cachedServerAbbr = serverAbbrByHost.get(requestHost)

  if (cachedServerAbbr) {
    return cachedServerAbbr
  }

  const servers = await prisma.server.findMany({
    select: {
      abbreviation: true,
      baseUrl: true,
    },
  })

  for (const server of servers) {
    const serverHost = new URL(server.baseUrl).hostname.toLowerCase()

    if (serverHost !== requestHost) {
      continue
    }

    const resolvedServerAbbr = server.abbreviation.toLowerCase()
    serverAbbrByHost.set(requestHost, resolvedServerAbbr)

    return resolvedServerAbbr
  }

  return null
}

const DecodeTtyrecQuery = Type.Object({
  url: Type.String({ format: 'uri' }),
})

type DecodeTtyrecQueryType = Static<typeof DecodeTtyrecQuery>

const ExtractTimestampsQuery = Type.Object({
  url: Type.String({ format: 'uri' }),
})

type ExtractTimestampsQueryType = Static<typeof ExtractTimestampsQuery>

export const ttyrecRoute = (app: AppType) => {
  app.get<{ Querystring: DecodeTtyrecQueryType }>(
    '/api/ttyrec/decode',
    {
      schema: {
        querystring: DecodeTtyrecQuery,
      },
    },
    async (request, reply) => {
      const serverAbbr = await resolveServerAbbrFromUrl(request.query.url)

      if (!serverAbbr) {
        return reply.status(400).send('Invalid ttyrec url')
      }

      try {
        const decoded = await queueRequestByServerAbbr(serverAbbr, () =>
          decodeTtyrecFromUrl(request.query.url),
        )
        const fullText = decoded.textClean

        return {
          data: {
            stats: decoded.stats,
            frames: decoded.frames,
            decodedText: fullText,
            decodedTextLength: fullText.length,
          },
        }
      } catch (error) {
        app.log.error(error)
        return reply.status(400).send('Unable to fetch or decode ttyrec file')
      }
    },
  )

  app.get<{ Querystring: Pick<DecodeTtyrecQueryType, 'url'> }>(
    '/api/ttyrec/raw',
    {
      schema: {
        querystring: Type.Object({
          url: Type.String({ format: 'uri' }),
        }),
      },
    },
    async (request, reply) => {
      const serverAbbr = await resolveServerAbbrFromUrl(request.query.url)

      if (!serverAbbr) {
        return reply.status(400).send('Invalid ttyrec url')
      }

      try {
        const ttyrecBuffer = await queueRequestByServerAbbr(serverAbbr, () =>
          getTtyrecBufferFromUrl(request.query.url),
        )

        return reply
          .header('content-type', 'application/octet-stream')
          .header('cache-control', 'no-store')
          .send(ttyrecBuffer)
      } catch (error) {
        app.log.error(error)
        return reply.status(400).send('Unable to fetch or decode ttyrec file')
      }
    },
  )

  app.get<{ Querystring: ExtractTimestampsQueryType }>(
    '/api/ttyrec/extract-timestamps',
    {
      schema: {
        querystring: ExtractTimestampsQuery,
      },
    },
    async (request, reply) => {
      const serverAbbr = await resolveServerAbbrFromUrl(request.query.url)

      if (!serverAbbr) {
        return reply.status(400).send('Invalid ttyrec url')
      }

      try {
        const extracted = await queueRequestByServerAbbr(serverAbbr, () =>
          extractTimestampDataFromUrl(request.query.url),
        )

        return {
          data: extracted,
        }
      } catch (error) {
        app.log.error(error)
        return reply.status(400).send('Unable to fetch or extract timestamp file')
      }
    },
  )

  const RecordingsQuery = Type.Object({
    player: Type.String(),
    server: Type.String(),
    startAt: Type.String(),
  })
  app.get<{ Querystring: Static<typeof RecordingsQuery> }>(
    '/api/ttyrec/recordings',
    {
      schema: {
        querystring: RecordingsQuery,
      },
    },
    async (request, reply) => {
      const server = await prisma.server.findFirst({
        where: {
          abbreviation: request.query.server,
        },
      })

      if (!server || !server.ttyrecUrl) {
        return reply.status(400).send('Invalid server')
      }

      const game = await prisma.game.findFirst({
        where: {
          name: request.query.player,
          startAt: request.query.startAt,
          logfile: {
            serverId: server.id,
          },
        },
      })

      if (!game) {
        return reply.status(400).send('Game not found')
      }

      const ttyrecsListUrl = new URL(`${server.ttyrecUrl}/${game.name}`).toString()

      try {
        const listingResponse = await queueRequestByServerAbbr(server.abbreviation, () =>
          fetch(ttyrecsListUrl),
        )

        if (!listingResponse.ok) {
          return reply.status(400).send('Unable to fetch recordings listing')
        }

        const html = await listingResponse.text()
        const rowMatches = [...html.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)]
        const recordings: Array<{ link: string; size: string; fileDate: string; date: Date }> = []

        for (const rowMatch of rowMatches) {
          const rowHtml = rowMatch[1]

          if (!rowHtml) {
            continue
          }

          const linkMatch = rowHtml.match(
            /<td\b[^>]*class="[^"]*link[^"]*"[^>]*>[\s\S]*?<a\b[^>]*href="([^"]+)"[^>]*>/i,
          )
          const sizeMatch = rowHtml.match(/<td\b[^>]*class="[^"]*size[^"]*"[^>]*>([\s\S]*?)<\/td>/i)
          const fileDateMatch = rowHtml.match(
            /<td\b[^>]*class="[^"]*date[^"]*"[^>]*>([\s\S]*?)<\/td>/i,
          )

          const href = linkMatch?.[1]
          const size = sizeMatch?.[1]
          const fileDate = fileDateMatch?.[1]

          if (!href || !size || !fileDate) {
            continue
          }

          const dateTimeFromLink = decodeURIComponent(href).match(
            /(\d{4}-\d{2}-\d{2}\.\d{2}:\d{2}:\d{2})/,
          )
          const date = dateTimeFromLink
            ? dayjs.utc(dateTimeFromLink[1], 'YYYY-MM-DD.HH:mm:ss')
            : null

          if (!date || !date.isValid()) {
            continue
          }

          recordings.push({
            date: date.utc().toDate(),
            link: new URL(href, ttyrecsListUrl + '/').toString(),
            size: size.replace(/<[^>]+>/g, '').trim(),
            fileDate: fileDate.replace(/<[^>]+>/g, '').trim(),
          })
        }

        const potentialRecordings = []
        let closestRecording: (typeof recordings)[number] | null = null

        for (const rec of recordings) {
          if (!game) {
            break
          }

          if (rec.date <= game.startAt) {
            closestRecording = rec
            continue
          }

          if (rec.date > game.startAt && rec.date <= game.endAt) {
            potentialRecordings.push(rec)
          }
        }

        if (closestRecording) {
          potentialRecordings.unshift(closestRecording)
        }

        return {
          data: potentialRecordings,
        }
      } catch (error) {
        app.log.error(error)
        return reply.status(400).send('Unable to fetch recordings listing')
      }
    },
  )
}
