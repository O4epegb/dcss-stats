import { date } from '~/utils'

const version = '0.33'
const start = '2025-05-02T20:00:00.000Z'
const end = '2025-05-18T20:00:00.000Z'

export const TournamentBanner = () => {
  const now = date()

  if (now.diff(end, 'week') > 3) {
    return null
  }

  const isUpcoming = now.isBefore(start)
  const isOngoing = now.isAfter(start) && now.isBefore(end)
  const isEnded = now.isAfter(end)

  return (
    <a
      href={
        isEnded
          ? `https://crawl.develz.org/wordpress/${version.replace('.', '-')}-tournament-results`
          : `https://crawl.develz.org/tournament/${version}/`
      }
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-center gap-2 rounded border-4 border-violet-400 bg-[#282020] p-2 text-center text-lg text-white"
    >
      {isUpcoming && (
        <span suppressHydrationWarning>
          The v{version} tournament starts at {date(start).format('LLLL')}
        </span>
      )}
      {isOngoing && (
        <span suppressHydrationWarning>
          The v{version} tournament will last until {date(end).format('LLLL')}
        </span>
      )}
      {isEnded && <>🏆🏆🏆 DCSS {version} Tournament Results</>}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="h-6 w-6 shrink-0"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
        />
      </svg>
    </a>
  )
}
