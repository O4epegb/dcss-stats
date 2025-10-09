import { PropsWithChildren } from 'react'
import { Logo } from '~/components/Logo'

export const Layout = ({
  rightColumn,
  children,
}: PropsWithChildren<{ rightColumn?: React.ReactNode }>) => {
  return (
    <div className="container mx-auto flex min-h-screen flex-col items-center gap-4 px-4 pb-8">
      <div className="grid w-full grid-cols-1 gap-8 md:grid-cols-3">
        <div className="col-span-3 xl:col-span-1">
          <div className="mx-auto flex max-w-md flex-col gap-4 pt-4">
            <header>
              <Logo />
            </header>
            <div className="w-full max-w-md rounded-sm bg-blue-100 px-2 py-1 text-xs text-black">
              <span className="font-semibold">TL;DR:</span> Choose the race, class or god you want
              to play (or any combination of these). Press the button to see the win rate of your
              combination, as well as other people&apos;s games.
              <br />
              The Matrix displays information for all races and backgrounds, but applies other
              selected filters.
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
        </div>
        <div className="col-span-2 hidden xl:block">{rightColumn}</div>
      </div>
    </div>
  )
}
