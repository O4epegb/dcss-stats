import { useRef, useState } from 'react'
import { Dialog, DialogContent, DialogTrigger } from '~/components/ui/Dialog'
import { cn } from '~/utils'

type LocalRecordingDialogProps = {
  disabled: boolean
  onSelect: (file: File) => void
}

export const LocalRecordingDialog = ({ disabled, onSelect }: LocalRecordingDialogProps) => {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        disabled={disabled}
        className={cn(
          'border-border hover:bg-surface-hover rounded-sm border px-3 py-1.5 text-sm',
          disabled && 'cursor-not-allowed opacity-60',
        )}
      >
        Open local file
      </DialogTrigger>

      <DialogContent
        title="Open a local recording"
        description="Choose a .ttyrec, .ttyrec.gz, or .ttyrec.bz2 file. It stays in your browser and is never uploaded."
      >
        <button
          type="button"
          className="bg-accent text-accent-foreground hover:bg-accent-hover rounded-sm px-3 py-1.5 text-sm"
          onClick={() => inputRef.current?.click()}
        >
          Choose recording
        </button>

        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept=".ttyrec,.gz,.bz2,application/gzip,application/x-bzip2,application/octet-stream"
          onChange={(event) => {
            const file = event.currentTarget.files?.[0]
            event.currentTarget.value = ''

            if (file) {
              setOpen(false)
              onSelect(file)
            }
          }}
        />
      </DialogContent>
    </Dialog>
  )
}
