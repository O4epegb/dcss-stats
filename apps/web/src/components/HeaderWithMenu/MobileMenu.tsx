'use client'

import { Menu } from '@base-ui/react/menu'
import { Bars3Icon } from '@heroicons/react/24/outline'
import Link from 'next/link'
import { ThemeSelector } from '~/components/ThemeSelector'
import { mobileMenuItems } from './menuItems'

const itemClassName =
  'block rounded px-3 py-2 text-sm leading-5 outline-none data-[highlighted]:bg-surface-hover'

export const MobileMenu = ({
  items = mobileMenuItems,
}: {
  items?: ReadonlyArray<{ href: string; label: string }>
}) => {
  return (
    <Menu.Root>
      <Menu.Trigger
        aria-label="Open menu"
        className="border-border bg-surface-muted text-foreground hover:bg-surface-hover focus-visible:outline-focus-ring active:bg-surface-active data-popup-open:bg-surface-hover flex h-9 items-center justify-center rounded-sm border px-2 select-none focus-visible:outline-2 focus-visible:-outline-offset-1"
      >
        <Bars3Icon className="size-5" />
      </Menu.Trigger>

      <Menu.Portal>
        <Menu.Positioner align="end" sideOffset={8} className="z-20 outline-none">
          <Menu.Popup className="bg-surface text-foreground outline-border shadow-shadow/10 min-w-40 origin-(--transform-origin) rounded-md p-1 shadow-lg outline-1 transition-[transform,scale,opacity] data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0">
            {items.map((item) => (
              <Menu.LinkItem
                key={item.href}
                closeOnClick
                render={<Link prefetch={false} href={item.href} />}
                className={itemClassName}
              >
                {item.label}
              </Menu.LinkItem>
            ))}

            <Menu.Separator className="bg-border my-1 h-px" />

            <div className="px-2 py-1">
              <ThemeSelector />
            </div>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  )
}
