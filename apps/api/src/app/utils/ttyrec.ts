import { Readable, Writable } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import { gunzipSync } from 'node:zlib'
import axios from 'axios'
import unbzip2Stream from 'unbzip2-stream'

export type TtyrecFrame = {
  sec: number
  usec: number
  timestamp: number
  len: number
}

export type ParsedTtyrec = {
  frames: TtyrecFrame[]
  stats: {
    frameCount: number
    parsedBytes: number
    fileBytes: number
    durationSeconds: number
    truncated: boolean
    rawPayloadBytes: number
    cleanChars: number
  }
  textDecodedUtf8: string
  textClean: string
}

export type TimestampFrame = {
  unix: number
  isoUtc: string
  deltaFromPrevSeconds: number | null
}

export type ParsedTimestampData = {
  version: number
  count: number
  firstUnix: number | null
  lastUnix: number | null
  spanSeconds: number
  timestamps: TimestampFrame[]
}

const bzip2Magic = Buffer.from('BZh')
const gzipMagic = Buffer.from([0x1f, 0x8b])

const startsWith = (value: Buffer, prefix: Buffer) =>
  value.byteLength >= prefix.byteLength && value.subarray(0, prefix.byteLength).equals(prefix)

const decompressBzip2 = async (input: Buffer) => {
  const chunks: Buffer[] = []

  await pipeline(
    Readable.from(input),
    unbzip2Stream(),
    new Writable({
      write(chunk, _encoding, callback) {
        chunks.push(Buffer.from(chunk))
        callback()
      },
    }),
  )

  return Buffer.concat(chunks)
}

const maybeDecompress = async (input: Buffer, sourceUrl: string, contentType?: string) => {
  const normalizedUrl = sourceUrl.toLowerCase()
  const normalizedContentType = contentType?.toLowerCase() ?? ''

  const looksBzip2 = startsWith(input, bzip2Magic)
  const looksGzip = startsWith(input, gzipMagic)

  const urlBzip2 = normalizedUrl.endsWith('.bz2')
  const urlGzip = normalizedUrl.endsWith('.gz')

  const typeBzip2 =
    normalizedContentType.includes('bzip2') || normalizedContentType.includes('x-bzip')
  const typeGzip = normalizedContentType.includes('gzip')

  if (looksBzip2 || urlBzip2 || typeBzip2) {
    return decompressBzip2(input)
  }

  if (looksGzip || urlGzip || typeGzip) {
    return gunzipSync(input)
  }

  return input
}

const stripAnsiSequences = (input: string) => {
  let result = ''

  for (let index = 0; index < input.length; index += 1) {
    const charCode = input.charCodeAt(index)

    if (charCode !== 27) {
      result += input[index]
      continue
    }

    const next = input[index + 1]

    if (next === '[') {
      index += 2

      while (index < input.length) {
        const code = input.charCodeAt(index)
        if (code >= 64 && code <= 126) {
          break
        }
        index += 1
      }

      continue
    }

    if (next === ']') {
      index += 2

      while (index < input.length) {
        const code = input.charCodeAt(index)

        if (code === 7) {
          break
        }

        if (code === 27 && input[index + 1] === '\\') {
          index += 1
          break
        }

        index += 1
      }

      continue
    }

    index += 1
  }

  return result
}

export const cleanTerminalText = (input: string) => {
  const withoutAnsi = stripAnsiSequences(input)
  const withoutCarriageReturns = withoutAnsi.replace(/\r/g, '')
  let withoutControlChars = ''

  for (const char of withoutCarriageReturns) {
    const code = char.charCodeAt(0)
    const isControl = (code >= 0 && code <= 7) || (code >= 11 && code <= 31) || code === 127

    if (!isControl) {
      withoutControlChars += char
    }
  }

  const output: string[] = []

  for (const char of withoutControlChars) {
    if (char === '\b') {
      output.pop()
      continue
    }

    output.push(char)
  }

  return output.join('').replace(/\n{4,}/g, '\n\n\n')
}

export const parseTtyrec = (buffer: Buffer): ParsedTtyrec => {
  const fileBytes = buffer.byteLength
  let position = 0
  let frameCount = 0
  let startTimestamp = 0
  let endTimestamp = 0
  let truncated = false
  const frames: TtyrecFrame[] = []
  const payloadChunks: Buffer[] = []

  while (position + 12 <= fileBytes) {
    const sec = buffer.readUInt32LE(position)
    const usec = buffer.readUInt32LE(position + 4)
    const len = buffer.readUInt32LE(position + 8)
    const payloadStart = position + 12
    const payloadEnd = payloadStart + len

    if (payloadEnd > fileBytes) {
      truncated = true
      break
    }

    const timestamp = sec + usec / 1_000_000

    if (frameCount === 0) {
      startTimestamp = timestamp
    }

    endTimestamp = timestamp
    frameCount += 1
    frames.push({ sec, usec, timestamp, len })
    payloadChunks.push(buffer.subarray(payloadStart, payloadEnd))
    position = payloadEnd
  }

  const rawCombined = Buffer.concat(payloadChunks)
  const textDecodedUtf8 = rawCombined.toString('utf-8')
  const textClean = cleanTerminalText(textDecodedUtf8)

  return {
    textDecodedUtf8,
    textClean,
    frames,
    stats: {
      frameCount,
      parsedBytes: position,
      fileBytes,
      durationSeconds: frameCount > 0 ? endTimestamp - startTimestamp : 0,
      truncated,
      rawPayloadBytes: rawCombined.byteLength,
      cleanChars: textClean.length,
    },
  }
}

export const decodeTtyrecFromUrl = async (url: string) => {
  const ttyrecBuffer = await getTtyrecBufferFromUrl(url)
  const parsed = parseTtyrec(ttyrecBuffer)

  if (parsed.stats.frameCount === 0 && parsed.stats.fileBytes > 0) {
    throw new Error('No ttyrec frames parsed from payload')
  }

  return parsed
}

export const getTtyrecBufferFromUrl = async (url: string) => {
  const response = await axios.get<ArrayBuffer>(url, {
    responseType: 'arraybuffer',
    timeout: 30_000,
    maxContentLength: 50 * 1024 * 1024,
    maxBodyLength: 50 * 1024 * 1024,
  })

  const compressedBuffer = Buffer.from(response.data)
  const sourceContentType = Array.isArray(response.headers?.['content-type'])
    ? response.headers['content-type'].join(';')
    : response.headers?.['content-type']

  const ttyrecBuffer = await maybeDecompress(compressedBuffer, url, sourceContentType)

  if (ttyrecBuffer.byteLength === 0) {
    throw new Error('TTYREC payload is empty after fetch/decompression')
  }

  return ttyrecBuffer
}

export const parseTimestampBinary = (buffer: Buffer): ParsedTimestampData => {
  if (buffer.byteLength < 4 || buffer.byteLength % 4 !== 0) {
    throw new Error('Invalid timestamp payload size')
  }

  const version = buffer.readUInt32BE(0)
  const timestamps: TimestampFrame[] = []
  let previousUnix: number | null = null

  for (let offset = 4; offset < buffer.byteLength; offset += 4) {
    const unix = buffer.readUInt32BE(offset)
    const isoUtc = new Date(unix * 1000).toISOString()
    const deltaFromPrevSeconds = previousUnix === null ? null : unix - previousUnix

    timestamps.push({ unix, isoUtc, deltaFromPrevSeconds })
    previousUnix = unix
  }

  const firstUnix = timestamps[0]?.unix ?? null
  const lastUnix = timestamps[timestamps.length - 1]?.unix ?? null

  return {
    version,
    count: timestamps.length,
    firstUnix,
    lastUnix,
    spanSeconds: firstUnix !== null && lastUnix !== null ? lastUnix - firstUnix : 0,
    timestamps,
  }
}

export const extractTimestampDataFromUrl = async (url: string) => {
  const response = await axios.get<ArrayBuffer>(url, {
    responseType: 'arraybuffer',
    timeout: 30_000,
    maxContentLength: 10 * 1024 * 1024,
    maxBodyLength: 10 * 1024 * 1024,
  })

  const inputBuffer = Buffer.from(response.data)
  const sourceContentType = Array.isArray(response.headers?.['content-type'])
    ? response.headers['content-type'].join(';')
    : response.headers?.['content-type']
  const decodedBuffer = await maybeDecompress(inputBuffer, url, sourceContentType)

  return parseTimestampBinary(decodedBuffer)
}
