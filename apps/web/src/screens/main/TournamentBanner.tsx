import { ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline'
import { date } from '~/utils'

const version = '0.34'
const start = '2026-02-06T20:00:00.000Z'
const end = '2026-02-18T20:00:00.000Z'
const hasTournamentLinkAlready = false

export const TournamentBanner = async () => {
  'use cache'

  const now = date()

  if (now.diff(end, 'week') > 3) {
    return null
  }

  const isUpcoming = now.isBefore(start)
  const isOngoing = now.isAfter(start) && now.isBefore(end)
  const isEnded = now.isAfter(end)

  const content = (
    <>
      {isUpcoming && (
        <span suppressHydrationWarning>
          The v{version} tournament starts on {date(start).format('LLLL')}
        </span>
      )}
      {isOngoing && (
        <span suppressHydrationWarning>
          The v{version} tournament will last until {date(end).format('LLLL')}
        </span>
      )}
      {isEnded && <>🏆🏆🏆 DCSS {version} Tournament Results</>}
      <ArrowTopRightOnSquareIcon className="h-6 w-6 shrink-0" />
    </>
  )

  const wrapperClassNames =
    'flex items-center justify-center gap-2 rounded-sm border-4 border-violet-400 bg-[#282020] p-2 text-center text-lg text-white'

  const href = hasTournamentLinkAlready
    ? isEnded
      ? `https://crawl.develz.org/wordpress/${version.replace('.', '-')}-tournament-results`
      : `https://crawl.develz.org/tournament/${version}/`
    : 'https://crawl.develz.org/wordpress/0-34-trunk-update-and-tournament-announcement'

  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={wrapperClassNames}>
      {content}
    </a>
  )
}
