import { fetchApi } from '~/api/server'
import { Logo } from '~/components/Logo'
import { SupportersCurrentResponse } from '~/types'

export const revalidate = 0

const SupportPage = async () => {
  const res = await fetchApi('/supporters/current')
  const data: SupportersCurrentResponse = await res.json()

  if (!res.ok) {
    throw res
  }

  return (
    <div className="container mx-auto flex min-h-screen flex-col items-center space-y-4 py-4 pt-4">
      <header>
        <Logo />
      </header>

      <div className="w-full max-w-lg space-y-2">
        <h2 className="text-lg font-semibold">Support</h2>
        <div>
          Current monthly goal: <span className="text-amber-400">${data.total}</span> of{' '}
          <span className="text-amber-400">${data.goal}</span>
        </div>
      </div>
    </div>
  )
}

export default SupportPage
