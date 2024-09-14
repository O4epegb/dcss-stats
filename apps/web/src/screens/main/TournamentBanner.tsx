import dayjs from 'dayjs'
import LocalizedFormat from 'dayjs/plugin/localizedFormat'

dayjs.extend(LocalizedFormat)

const version = '0.32'
const start = '2024-08-30T20:00:00.000Z'
const end = '2024-09-15T20:00:00.000Z'

export const TournamentBanner = () => {
  const now = dayjs()

  if (now.diff(end, 'week') > 3) {
    return null
  }

  return (
    <a
      href={`https://crawl.develz.org/tournament/${version}/`}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-center gap-2 rounded border-4 border-violet-400 bg-[#282020] p-2 text-center text-lg text-white"
    >
      {now.isBefore(start) && (
        <span suppressHydrationWarning>
          The v{version} tournament starts at {dayjs(start).format('LLLL')}
        </span>
      )}
      {now.isAfter(start) && now.isBefore(end) && (
        <span suppressHydrationWarning>
          The v{version} tournament will last until {dayjs(end).format('LLLL')}
        </span>
      )}
      {now.isAfter(end) && <>🏆🏆🏆 DCSS {version} Tournament Results</>}
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
