import type { PlayerInstance } from 'asciinema-player'
import { useEffect, useRef, useState } from 'react'
import { Loader } from '~/components/ui/Loader'
import { cn } from '~/utils'

export type TtyrecSource = {
  id: string
  label: string
  load: () => Promise<Blob>
}

type TtyrecPlayerProps = {
  source: TtyrecSource
  onBusyChange: (isBusy: boolean) => void
}

export const TtyrecPlayer = ({ source, onBusyChange }: TtyrecPlayerProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const container = containerRef.current

    if (!container) {
      return
    }

    let cancelled = false
    let player: PlayerInstance | null = null

    const disposePlayer = () => {
      player?.dispose()
      container.replaceChildren()
    }

    const startPlayer = async () => {
      setError(null)
      setIsLoading(true)
      onBusyChange(true)

      try {
        const [AsciinemaPlayer, recording] = await Promise.all([
          import('asciinema-player'),
          source.load(),
        ])

        if (cancelled) {
          return
        }

        player = AsciinemaPlayer.create(
          {
            data: Promise.resolve(recording),
            parser: 'ttyrec',
            fit: 'width',
          },
          container,
        )

        await player.play()
      } catch (error) {
        if (!cancelled) {
          disposePlayer()
          setError(error instanceof Error ? error.message : 'Could not load this recording.')
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
          onBusyChange(false)
        }
      }
    }

    void startPlayer()

    return () => {
      cancelled = true
      disposePlayer()
      onBusyChange(false)
    }
  }, [onBusyChange, source])

  return (
    <section className="space-y-2">
      <div className="flex flex-wrap items-baseline gap-x-2">
        <h3 className="font-semibold">Recording player</h3>
        <span className="text-muted-foreground max-w-full truncate text-sm" title={source.label}>
          {source.label}
        </span>
      </div>

      {isLoading && (
        <div className="text-muted-foreground flex items-center gap-2 text-sm" aria-live="polite">
          <Loader />
          <span>Preparing recording…</span>
        </div>
      )}

      {error && (
        <div
          className="border-danger-border bg-danger-surface text-danger-foreground rounded-sm border p-3 text-sm"
          role="alert"
        >
          {error}
        </div>
      )}

      <div className={cn('border-border rounded-sm border p-2', error && 'hidden')}>
        <div ref={containerRef} />
      </div>
    </section>
  )
}
