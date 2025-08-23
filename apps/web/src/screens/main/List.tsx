import Link from 'next/link'
import { ReactNode } from 'react'
import { HelpBubble } from '~/components/ui/Tooltip'

export const List = ({
  title,
  tooltip,
  items,
  placeholder,
  onLinkClick,
}: {
  title: string
  items: Array<{
    name: string
    count?: string
  }>
  onLinkClick: (name: string) => void
  placeholder?: ReactNode
  tooltip?: string
}) => {
  return (
    <div className="space-y-1">
      <div className="flex justify-between gap-1">
        <h3 className="font-semibold">{title}:</h3>
        {tooltip && <HelpBubble content={tooltip} />}
      </div>
      <div>
        {placeholder}
        {items.map((item) => (
          <Link
            key={item.name}
            prefetch={false}
            href={`/players/${item.name}`}
            className="-mx-1 flex justify-between rounded-sm px-1 hover:bg-amber-100 dark:hover:bg-zinc-700"
            onClick={(e) => {
              if (!e.metaKey && !e.ctrlKey) {
                onLinkClick(item.name)
              }
            }}
          >
            <span className="overflow-hidden text-ellipsis whitespace-nowrap">{item.name}</span>
            {item.count && <span className="tabular-nums">{item.count}</span>}
          </Link>
        ))}
      </div>
    </div>
  )
}
