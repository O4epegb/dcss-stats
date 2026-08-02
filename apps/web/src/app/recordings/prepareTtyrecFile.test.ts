import { gzipSync } from 'node:zlib'
import { describe, expect, test } from 'vitest'
import { prepareTtyrecFile } from './prepareTtyrecFile'

const buildTtyrec = (text: string) => {
  const payload = new TextEncoder().encode(text)
  const frame = new Uint8Array(12 + payload.byteLength)
  const header = new DataView(frame.buffer)

  header.setUint32(0, 100, true)
  header.setUint32(4, 250_000, true)
  header.setUint32(8, payload.byteLength, true)
  frame.set(payload, 12)

  return frame
}

const readFirstFrame = async (recording: Blob) => {
  const bytes = new Uint8Array(await recording.arrayBuffer())
  return new TextDecoder().decode(bytes.subarray(12))
}

describe('prepareTtyrecFile', () => {
  test('accepts an uncompressed ttyrec', async () => {
    const file = new File([buildTtyrec('Player: Hero\n')], 'game.ttyrec')

    const recording = await prepareTtyrecFile(file)

    expect(await readFirstFrame(recording)).toBe('Player: Hero\n')
  })

  test('decompresses a real gzip stream', async () => {
    const compressed = gzipSync(buildTtyrec('Dungeon Crawl\n'))
    const file = new File([compressed], 'game.ttyrec.gz')

    const recording = await prepareTtyrecFile(file)

    expect(await readFirstFrame(recording)).toBe('Dungeon Crawl\n')
  })

  test('decompresses a real bzip2 stream', async () => {
    const compressedBase64 =
      'QlpoOTFBWSZTWTGEu6MAAAffgEgSQAAAEABAQAAmBJAgIAAiJpkwmNCmAAJNT4Vq+R7JFW4IaLuSKcKEgYwl3Rg='
    const compressed = Buffer.from(compressedBase64, 'base64')
    const file = new File([compressed], 'game.ttyrec.bz2')

    const recording = await prepareTtyrecFile(file)

    expect(await readFirstFrame(recording)).toBe('Player: Hero\n')
  })

  test('rejects a truncated ttyrec frame', async () => {
    const frame = buildTtyrec('short')
    new DataView(frame.buffer).setUint32(8, 100, true)
    const file = new File([frame], 'broken.ttyrec')

    await expect(prepareTtyrecFile(file)).rejects.toThrow('not a valid ttyrec')
  })
})
