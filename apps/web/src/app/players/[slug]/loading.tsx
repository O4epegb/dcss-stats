import { Loader } from '~/components/ui/Loader'

export default function Loading() {
  return (
    <div className="flex min-h-dvh w-full flex-col items-center justify-center gap-4">
      <Loader />
      Loading player data
    </div>
  )
}
