declare module 'unbzip2-stream/dist/unbzip2-stream.min.js' {
  type Bzip2Stream = {
    on(event: 'data', handler: (chunk: Uint8Array) => void): Bzip2Stream
    on(event: 'error', handler: (error: unknown) => void): Bzip2Stream
    on(event: 'end', handler: () => void): Bzip2Stream
    end(input: Uint8Array): void
  }

  const createBzip2Stream: () => Bzip2Stream

  export default createBzip2Stream
}
