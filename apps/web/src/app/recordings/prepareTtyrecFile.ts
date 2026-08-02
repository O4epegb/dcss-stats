const MAX_SOURCE_BYTES = 50 * 1024 * 1024
const MAX_DECOMPRESSED_BYTES = 100 * 1024 * 1024
const TTYREC_HEADER_BYTES = 12

const gzipMagic = [0x1f, 0x8b]
const bzip2Magic = [0x42, 0x5a, 0x68]

class RecordingFileError extends Error {}

const hasMagic = (bytes: Uint8Array, magic: number[]) =>
  magic.every((value, index) => bytes[index] === value)

const copyChunk = (chunk: Uint8Array) => {
  const copy = new Uint8Array(chunk.byteLength)
  copy.set(chunk)
  return copy.buffer
}

const collectStream = async (stream: ReadableStream<Uint8Array>) => {
  const chunks: ArrayBuffer[] = []
  const reader = stream.getReader()
  let totalBytes = 0

  try {
    while (true) {
      const { done, value } = await reader.read()

      if (done) {
        break
      }

      totalBytes += value.byteLength

      if (totalBytes > MAX_DECOMPRESSED_BYTES) {
        await reader.cancel().catch(() => undefined)
        throw new RecordingFileError('The decompressed recording is too large to play safely.')
      }

      chunks.push(copyChunk(value))
    }
  } finally {
    reader.releaseLock()
  }

  return new Blob(chunks, { type: 'application/octet-stream' })
}

const decompressGzip = async (file: File) => {
  try {
    const decompressedStream = file.stream().pipeThrough(new DecompressionStream('gzip'))
    return await collectStream(decompressedStream)
  } catch (error) {
    if (error instanceof RecordingFileError) {
      throw error
    }

    throw new RecordingFileError('Could not decompress this gzip recording.')
  }
}

const decompressBzip2 = async (file: File) => {
  const { default: createBzip2Stream } = await import('unbzip2-stream/dist/unbzip2-stream.min.js')
  const input = new Uint8Array(await file.arrayBuffer())

  return new Promise<Blob>((resolve, reject) => {
    const chunks: ArrayBuffer[] = []
    const stream = createBzip2Stream()
    let totalBytes = 0
    let settled = false

    const rejectOnce = (error: unknown) => {
      if (settled) {
        return
      }

      settled = true
      reject(
        error instanceof RecordingFileError
          ? error
          : new RecordingFileError('Could not decompress this bzip2 recording.'),
      )
    }

    stream.on('data', (chunk) => {
      totalBytes += chunk.byteLength

      if (totalBytes > MAX_DECOMPRESSED_BYTES) {
        throw new RecordingFileError('The decompressed recording is too large to play safely.')
      }

      chunks.push(copyChunk(chunk))
    })
    stream.on('error', rejectOnce)
    stream.on('end', () => {
      if (settled) {
        return
      }

      settled = true
      resolve(new Blob(chunks, { type: 'application/octet-stream' }))
    })

    try {
      stream.end(input)
    } catch (error) {
      rejectOnce(error)
    }
  })
}

const validateTtyrec = async (file: Blob) => {
  const buffer = await file.arrayBuffer()
  const view = new DataView(buffer)
  let offset = 0
  let hasPayload = false

  while (offset < view.byteLength) {
    const remainingBytes = view.byteLength - offset

    if (remainingBytes < TTYREC_HEADER_BYTES) {
      throw new RecordingFileError('This file is not a valid ttyrec recording.')
    }

    const microseconds = view.getUint32(offset + 4, true)
    const payloadBytes = view.getUint32(offset + 8, true)

    if (microseconds >= 1_000_000 || payloadBytes > remainingBytes - TTYREC_HEADER_BYTES) {
      throw new RecordingFileError('This file is not a valid ttyrec recording.')
    }

    hasPayload ||= payloadBytes > 0
    offset += TTYREC_HEADER_BYTES + payloadBytes
  }

  if (!hasPayload) {
    throw new RecordingFileError('This file is not a valid ttyrec recording.')
  }
}

export const prepareTtyrecFile = async (file: File) => {
  if (file.size > MAX_SOURCE_BYTES) {
    throw new RecordingFileError('This recording is too large to open in the browser.')
  }

  const magic = new Uint8Array(await file.slice(0, bzip2Magic.length).arrayBuffer())
  let ttyrec: Blob = file

  if (hasMagic(magic, bzip2Magic)) {
    ttyrec = await decompressBzip2(file)
  } else if (hasMagic(magic, gzipMagic)) {
    ttyrec = await decompressGzip(file)
  }

  if (ttyrec.size > MAX_DECOMPRESSED_BYTES) {
    throw new RecordingFileError('The decompressed recording is too large to play safely.')
  }

  await validateTtyrec(ttyrec)

  return ttyrec
}
