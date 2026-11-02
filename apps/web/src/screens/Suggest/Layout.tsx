import { PropsWithChildren, ReactNode, useId, useState } from 'react'
import { MobileMenu } from '~/components/HeaderWithMenu/MobileMenu'
import { Logo } from '~/components/Logo'
import { cn } from '~/utils'

export const Layout = ({
  rightColumn,
  controls,
  children,
}: PropsWithChildren<{ rightColumn: ReactNode; controls: ReactNode }>) => {
  const [chartsOpen, setChartsOpen] = useState(false)
  const chartsId = useId()

  return (
    <div className="container mx-auto flex min-h-screen flex-col items-center gap-4 px-4 pb-8">
      <div className="grid w-full grid-cols-1 gap-4 xl:grid-cols-3 xl:grid-rows-[auto_1fr] xl:gap-x-8">
        <div className="min-w-0">
          <div className="mx-auto flex max-w-md flex-col gap-4 pt-4">
            <header className="flex items-center justify-between">
              <Logo />
              <MobileMenu />
            </header>
            <div className="bg-info-surface text-info-foreground w-full max-w-md rounded-sm px-2 py-1 text-xs">
              <span className="font-semibold">TL;DR:</span> Choose the race, class or god you want
              to play (or any combination of these). Press the button to see the win rate of your
              combination, as well as other people&apos;s games.
              <br />
              The matrix and scatter plot use the selected version, god and advanced filters across
              all races and backgrounds. Their own filters narrow the displayed combinations without
              changing the results below.
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
            {controls}
          </div>
        </div>
        <section className="min-w-0 xl:col-span-2 xl:col-start-2 xl:row-span-2 xl:row-start-1">
          <button
            type="button"
            aria-expanded={chartsOpen}
            aria-controls={chartsId}
            className="border-border bg-surface-emphasis flex min-h-11 w-full items-center justify-between gap-2 rounded-sm border px-3 py-2 text-left xl:hidden"
            onClick={() => setChartsOpen((open) => !open)}
          >
            <span className="font-medium">Combination charts</span>
            <span className="text-muted-foreground text-sm">{chartsOpen ? 'Hide' : 'Show'}</span>
          </button>
          <div id={chartsId} className={cn('xl:h-full', !chartsOpen && 'hidden xl:block')}>
            {rightColumn}
          </div>
        </section>
        <div className="min-w-0 xl:col-start-1 xl:row-start-2">
          <div className="mx-auto flex max-w-md flex-col gap-4">{children}</div>
        </div>
      </div>
    </div>
  )
}
