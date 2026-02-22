import { describe, expect, test, vi, beforeEach } from 'vitest'
import { cleanTerminalText, decodeTtyrecFromUrl, parseTimestampBinary, parseTtyrec } from './ttyrec'

const { axiosGetMock } = vi.hoisted(() => ({
  axiosGetMock: vi.fn(),
}))

vi.mock('axios', () => ({
  default: {
    get: axiosGetMock,
  },
}))

const buildFrame = (sec: number, usec: number, payload: Buffer) => {
  const header = Buffer.alloc(12)
  header.writeUInt32LE(sec, 0)
  header.writeUInt32LE(usec, 4)
  header.writeUInt32LE(payload.byteLength, 8)
  return Buffer.concat([header, payload])
}

describe('cleanTerminalText', () => {
  test('strips ANSI escapes and carriage returns', () => {
    const input = '\u001b[31mRed\u001b[0m\r\nOK\n'
    expect(cleanTerminalText(input)).toBe('Red\nOK\n')
  })

  test('applies backspace semantics', () => {
    const input = 'ab\b\bc\n'
    expect(cleanTerminalText(input)).toBe('c\n')
  })
})

beforeEach(() => {
  axiosGetMock.mockReset()
})

describe('parseTtyrec', () => {
  test('parses valid frames and returns cleaned text and stats', () => {
    const frameA = buildFrame(100, 0, Buffer.from('\u001b[32mPlayer:\u001b[0m Hero\n'))
    const frameB = buildFrame(101, 250_000, Buffer.from('Game: test\r\n'))
    const input = Buffer.concat([frameA, frameB])

    const result = parseTtyrec(input)

    expect(result.frames).toHaveLength(2)
    expect(result.stats.frameCount).toBe(2)
    expect(result.stats.parsedBytes).toBe(input.byteLength)
    expect(result.stats.fileBytes).toBe(input.byteLength)
    expect(result.stats.truncated).toBe(false)
    expect(result.stats.durationSeconds).toBeCloseTo(1.25)
    expect(result.textClean).toContain('Player: Hero')
    expect(result.textClean).toContain('Game: test\n')
  })

  test('stops at truncated frame and marks output as truncated', () => {
    const validFrame = buildFrame(10, 0, Buffer.from('hello\n'))
    const invalidHeader = Buffer.alloc(12)
    invalidHeader.writeUInt32LE(11, 0)
    invalidHeader.writeUInt32LE(0, 4)
    invalidHeader.writeUInt32LE(20, 8)

    const input = Buffer.concat([validFrame, invalidHeader, Buffer.from('short')])
    const result = parseTtyrec(input)

    expect(result.frames).toHaveLength(1)
    expect(result.stats.truncated).toBe(true)
    expect(result.stats.parsedBytes).toBe(validFrame.byteLength)
    expect(result.textClean).toBe('hello\n')
  })
})

describe('decodeTtyrecFromUrl', () => {
  test('decompresses bz2 payload and parses ttyrec frames', async () => {
    const compressedBase64 =
      'QlpoOTFBWSZTWTGEu6MAAAffgEgSQAAAEABAQAAmBJAgIAAiJpkwmNCmAAJNT4Vq+R7JFW4IaLuSKcKEgYwl3Rg='
    const compressedPayload = Buffer.from(compressedBase64, 'base64')

    axiosGetMock.mockResolvedValue({
      data: compressedPayload,
      headers: {
        'content-type': 'application/x-bzip2',
      },
    })

    const result = await decodeTtyrecFromUrl(
      'https://archive.nemelex.cards/ttyrec/ASCIIPhilia/2024-06-30.23%3A26%3A01.ttyrec.bz2',
    )

    expect(result.stats.frameCount).toBe(1)
    expect(result.stats.truncated).toBe(false)
    expect(result.textClean).toBe('Player: Hero\n')
  })

  test('throws for non-empty payload with no valid ttyrec frames', async () => {
    axiosGetMock.mockResolvedValue({
      data: Buffer.from('this is not a ttyrec stream'),
      headers: {
        'content-type': 'application/octet-stream',
      },
    })

    await expect(decodeTtyrecFromUrl('https://example.com/not-a-ttyrec.bin')).rejects.toThrow(
      'No ttyrec frames parsed from payload',
    )
  })
})

describe('parseTimestampBinary', () => {
  test('parses big-endian timestamp payload with version header', () => {
    const values = [0x00000001, 1730585200, 1730585209, 1730585223, 1730585231, 1730585236]
    const buffer = Buffer.alloc(values.length * 4)

    values.forEach((value, index) => {
      buffer.writeUInt32BE(value, index * 4)
    })

    const result = parseTimestampBinary(buffer)

    expect(result.version).toBe(1)
    expect(result.count).toBe(5)
    expect(result.firstUnix).toBe(1730585200)
    expect(result.lastUnix).toBe(1730585236)
    expect(result.spanSeconds).toBe(36)
    expect(result.timestamps[0]).toMatchObject({
      unix: 1730585200,
      deltaFromPrevSeconds: null,
    })
    expect(result.timestamps[1]).toMatchObject({
      unix: 1730585209,
      deltaFromPrevSeconds: 9,
    })
  })

  test('throws on invalid payload size', () => {
    expect(() => parseTimestampBinary(Buffer.from([0, 1, 2]))).toThrow(
      'Invalid timestamp payload size',
    )
  })
})
