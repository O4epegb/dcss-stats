import { Logo } from '~/components/Logo'

export default function Loading() {
  return (
    <div className="flex min-h-dvh w-full flex-col items-center justify-center gap-4">
      <Logo />
      Training Loading to level 27. This may take a few turns...
    </div>
  )
}
