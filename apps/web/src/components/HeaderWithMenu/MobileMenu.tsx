'use client'

import { Menu } from '@base-ui/react/menu'
import { Bars3Icon } from '@heroicons/react/24/outline'
import Link from 'next/link'
import { ThemeSelector } from '~/components/ThemeSelector'
import { menuItems } from './menuItems'

const itemClassName =
  'block rounded px-3 py-2 text-sm leading-5 outline-none data-[highlighted]:bg-gray-100 dark:data-[highlighted]:bg-zinc-800'

export const MobileMenu = ({
  items = menuItems,
}: {
  items?: ReadonlyArray<{ href: string; label: string }>
}) => {
  return (
    <Menu.Root>
      <Menu.Trigger
        aria-label="Open menu"
        className="flex h-9 items-center justify-center rounded-sm border border-gray-200 bg-gray-50 px-2 text-gray-900 select-none hover:bg-gray-100 focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-blue-800 active:bg-gray-100 data-popup-open:bg-gray-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:hover:bg-zinc-800"
      >
        <Bars3Icon className="size-5" />
      </Menu.Trigger>

      <Menu.Portal>
        <Menu.Positioner align="end" sideOffset={8} className="z-20 outline-none">
          <Menu.Popup className="min-w-40 origin-(--transform-origin) rounded-md bg-[canvas] p-1 text-gray-900 shadow-lg shadow-gray-200 outline-1 outline-gray-200 transition-[transform,scale,opacity] data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0 dark:text-white dark:shadow-none dark:-outline-offset-1 dark:outline-gray-300">
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

            <Menu.Separator className="my-1 h-px bg-gray-200 dark:bg-zinc-700" />

            <div className="px-2 py-1">
              <ThemeSelector />
            </div>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  )
}
