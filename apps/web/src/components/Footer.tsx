import Link from 'next/link'
import { cn } from '~/utils'

export const Footer = ({ className }: { className?: string }) => (
  <footer
    className={cn('grid justify-between gap-1 text-xs text-gray-400 md:grid-cols-2', className)}
  >
    <div>
      Player and game statistics for{' '}
      <a
        href="https://crawl.develz.org/"
        target="_blank"
        rel="noopener noreferrer"
        className="hover:underline"
      >
        Dungeon Crawl Stone Soup
      </a>
    </div>

    <div className="flex gap-4 md:justify-end">
      <Link className="hover:underline" prefetch={false} href="/servers">
        Tracked servers
      </Link>

      <a
        href="https://github.com/O4epegb/dcss-stats"
        target="_blank"
        rel="noopener noreferrer"
        className="hover:underline"
      >
        Github
      </a>

      <a
        href="https://www.buymeacoffee.com/totalnoob"
        target="_blank"
        rel="noopener noreferrer"
        className="hover:underline"
      >
        Donate to support this app
      </a>
    </div>

    <div>
      Made by <span className="font-semibold text-gray-500">totalnoob</span>, DM on{' '}
      <a
        href="https://discord.gg/pKCNTunFeW"
        target="_blank"
        rel="noopener noreferrer"
        className="hover:underline"
      >
        RL Discord
      </a>{' '}
      with bugs and suggestions
    </div>
  </footer>
)
