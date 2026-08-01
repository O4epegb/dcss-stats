'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '~/utils'

const pages = [
  { href: '/highscores', label: 'Highscores' },
  { href: '/highscores/leaderboard', label: 'Leaderboard' },
  { href: '/highscores/first', label: 'Most #1' },
]

export function PageTabs() {
  const pathname = usePathname()

  return (
    <div className="flex gap-1">
      {pages.map((page) => (
        <Link
          key={page.href}
          prefetch={false}
          href={page.href}
          className={cn(
            'rounded px-3 py-1 text-base',
            pathname === page.href ? 'bg-surface-active font-medium' : 'hover:bg-surface-hover',
          )}
        >
          {page.label}
        </Link>
      ))}
    </div>
  )
}
