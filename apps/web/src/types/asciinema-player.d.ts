declare module 'asciinema-player' {
  export type ParserName = 'asciicast' | 'ttyrec' | 'typescript'

  export type Marker = number | [number, string]

  export type SeekLocation =
    | number
    | `${number}%`
    | { marker: number }
    | { marker: 'prev' | 'next' }

  export type PlayerEventMap = {
    play: undefined
    playing: undefined
    pause: undefined
    ended: undefined
    input: { data: string }
    marker: { index: number; time: number; label?: string }
    metadata: { [key: string]: unknown }
    ready: undefined
    seeked: { time: number }
    vtUpdate: { screen: string[]; cursor: { x: number; y: number } }
    loading: undefined
    errored: { error: Error }
    offline: undefined
    idle: undefined
    muted: undefined
  }

  export type LoggerLike = {
    log?: (...args: unknown[]) => void
    debug?: (...args: unknown[]) => void
    info?: (...args: unknown[]) => void
    warn?: (...args: unknown[]) => void
    error?: (...args: unknown[]) => void
  }

  export type SourceOptions = {
    parser?: ParserName | ((response: Response) => unknown | Promise<unknown>)
    encoding?: string
    fit?: 'width' | 'height' | 'both' | 'none' | false
  } & (
    | {
        url: string | string[]
      }
    | {
        data: Promise<Blob | string>
      }
  )

  export type CreateOptions = {
    cols?: number
    rows?: number
    autoPlay?: boolean
    preload?: boolean
    loop?: boolean | number
    startAt?: number | string
    speed?: number
    idleTimeLimit?: number
    theme?: string
    poster?: string
    audioUrl?: string
    fit?: 'width' | 'height' | 'both' | 'none' | false
    controls?: boolean | 'auto'
    markers?: Marker[]
    pauseOnMarkers?: boolean
    terminalFontSize?: string
    terminalFontFamily?: string
    terminalLineHeight?: number
    logger?: LoggerLike
  }

  export type PlayerInstance = {
    getCurrentTime: () => number
    getDuration: () => number | null
    play: () => Promise<void>
    pause: () => void
    seek: (location: SeekLocation) => Promise<void>
    addEventListener: <TEventName extends keyof PlayerEventMap>(
      eventName: TEventName,
      handler: (this: PlayerInstance, event: PlayerEventMap[TEventName]) => void,
    ) => void
    dispose: () => void
  }

  export function create(
    source: string | SourceOptions,
    element: Element,
    options?: CreateOptions,
  ): PlayerInstance
}
