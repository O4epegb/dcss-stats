import clsx from 'clsx'
import { PropsWithChildren } from 'react'
import { Logo } from '~components/Logo'

export const Layout = ({ centered, children }: PropsWithChildren<{ centered: boolean }>) => {
  return (
    <div
      className={clsx(
        'container mx-auto flex min-h-screen flex-col items-center space-y-4 px-4 pb-8 pt-8',
        centered && 'md:justify-center md:pt-0',
      )}
    >
      <header>
        <Logo />
      </header>
      <div className="m-auto w-full max-w-md rounded bg-blue-100 px-2 py-1 text-sm text-black">
        <span className="font-semibold">TL;DR:</span> Choose the race, class or god you want to play
        (or any combination of these). Press the button to see the win rate of your combination, as
        well as other people&apos;s games.
        <br />
        <br />
        This tool is under development, for bugs and suggestions DM @totalnoob on{' '}
        <a
          href="https://discord.gg/pKCNTunFeW"
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
        >
          RL Discord
        </a>
      </div>
      {children}
    </div>
  )
}
