'use client'

import { ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline'
import { useState, useEffect } from 'react'
import { cn, date } from '~/utils'

const version = '0.34'
const start = '2026-02-06T20:00:00.000Z'
const end = '2026-02-18T20:00:00.000Z'
const hasTournamentLinkAlready = true

export const TournamentBanner = () => {
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setHydrated(true)
  }, [])

  const now = date()

  if (now.diff(end, 'week') > 3) {
    return null
  }

  const isUpcoming = now.isBefore(start)
  const isOngoing = now.isAfter(start) && now.isBefore(end)
  const isEnded = now.isAfter(end)

  const href = hasTournamentLinkAlready
    ? isEnded
      ? `https://crawl.develz.org/wordpress/${version.replace('.', '-')}-tournament-results`
      : `https://crawl.develz.org/tournament/${version}/`
    : 'https://crawl.develz.org/wordpress/0-34-trunk-update-and-tournament-announcement'

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-center gap-2 rounded-sm border-4 border-violet-400 bg-[#282020] p-2 text-center text-lg text-white"
    >
      <span className={cn('flex items-center justify-center gap-2', !hydrated && 'opacity-0')}>
        {isUpcoming && (
          <span>
            The v{version} tournament starts on{' '}
            {(hydrated ? date(start) : date(start).utc()).format('LLLL')}
            {!hydrated && ' (UTC)'}
          </span>
        )}
        {isOngoing && (
          <span>
            The v{version} tournament will last until{' '}
            {(hydrated ? date(end) : date(end).utc()).format('LLLL')}
            {!hydrated && ' (UTC)'}
          </span>
        )}
        {isEnded && <>🏆🏆🏆 DCSS {version} Tournament Results</>}
        <ArrowTopRightOnSquareIcon className="h-6 w-6 shrink-0" />
      </span>
    </a>
  )
}
