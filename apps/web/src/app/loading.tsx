import { sample } from 'lodash-es'
import { Logo } from '~/components/Logo'

const loadingPhrases = [
  'Training Loading to level 27. This may take a few turns...',
  'Consulting the Orb of Zot...',
  'Autoexploring the data. Please wait...',
  'Waiting for the database to take its turn...',
  'Reading a scroll of data acquisition...',
  'Quaffing a potion of query speed...',
  'You sense fresh data nearby...',
  'Xom is rearranging the database...',
  'Ashenzari is revealing the hidden records...',
]

export default async function Loading() {
  'use cache'

  const phrase = sample(loadingPhrases)

  return (
    <div className="flex min-h-dvh w-full flex-col items-center justify-center gap-4 text-center">
      <Logo />
      {phrase}
    </div>
  )
}
