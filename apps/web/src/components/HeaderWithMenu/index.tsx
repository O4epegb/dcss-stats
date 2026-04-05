import Link from 'next/link'
import { MobileMenu } from '~/components/HeaderWithMenu/MobileMenu'
import { Logo } from '~/components/Logo'
import { ThemeSelector } from '~/components/ThemeSelector'
import { SupportGoalText } from '~/screens/main/SupportGoalText'
import { menuItems } from './menuItems'

export const HeaderWithMenu = ({ showSupportGoal = false }: { showSupportGoal?: boolean }) => {
  return (
    <header className="flex w-full flex-col gap-2">
      <div className="flex items-center justify-between lg:hidden">
        <Logo />
        <MobileMenu items={menuItems} />
      </div>

      <div className="hidden lg:block">
        <div className="flex items-center justify-between">
          <Logo />
          <ThemeSelector />
        </div>
        <nav className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-base">
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
              </Link>
            )
          })}
        </nav>
      </div>
    </header>
  )
}
