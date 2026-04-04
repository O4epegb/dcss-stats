import Link from 'next/link'
import { MobileMenu } from '~/components/HeaderWithMenu/MobileMenu'
import { Logo } from '~/components/Logo'
import { ThemeSelector } from '~/components/ThemeSelector'
import { SupportGoalText } from '~/screens/main/SupportGoalText'
import { menuItems } from './menuItems'

export const HeaderWithMenu = ({ showSupportGoal = false }: { showSupportGoal?: boolean }) => {
  return (
    <header className="flex w-full items-center justify-between gap-2">
      <Logo />

      <div className="ml-auto lg:hidden">
        <MobileMenu items={menuItems} />
      </div>

      <div className="ml-auto hidden w-auto flex-1 justify-end gap-5 text-base lg:flex">
        {menuItems.map((item) => {
          if (item.href === '/support') {
            return (
              <Link
                key={item.href}
                prefetch={false}
                className="group relative flex items-center justify-center"
                href={item.href}
              >
                <span className="flex items-center justify-center gap-1 group-hover:underline">
                  {item.label}
                </span>
                {showSupportGoal && <SupportGoalText />}
              </Link>
            )
          }

          return (
            <Link
              key={item.href}
              prefetch={false}
              className="group relative flex items-center justify-center"
              href={item.href}
            >
              <span className="group-hover:underline">{item.label}</span>
              {/* <span className="absolute top-full rounded bg-amber-400 px-1 text-xs text-nowrap text-black">
                new
              </span> */}
            </Link>
          )
        })}

        <ThemeSelector />
      </div>
    </header>
  )
}
