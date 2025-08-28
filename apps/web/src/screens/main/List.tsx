import Link from 'next/link'
import { ReactNode } from 'react'
import { HelpBubble } from '~/components/ui/Tooltip'

export const List = ({
  title,
  afterTitle,
  tooltip,
  items,
  placeholder,
  onLinkClick,
}: {
  title: string
  afterTitle?: ReactNode
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
      <div className="flex items-center gap-1">
        <h3 className="font-semibold">{title}:</h3>
        {afterTitle}
        {tooltip && <HelpBubble className="ml-auto" content={tooltip} />}
      </div>
      <div>
        {placeholder}
        {items.map((item) => (
          <Link
            key={item.name}
            prefetch={false}
            href={`/players/${item.name}`}
            className="dcss-list-item"
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
