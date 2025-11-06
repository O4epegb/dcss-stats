import Link from 'next/link'
import { ReactNode } from 'react'
import { HelpBubble } from '~/components/ui/Tooltip'

export const List = ({
  title,
  afterTitle,
  tooltip,
  items,
  placeholder,
}: {
  title: string
  afterTitle?: ReactNode
  items: Array<{
    name: string
    count?: string
    secondaryCount?: string
  }>
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
          >
            <span className="overflow-hidden text-ellipsis whitespace-nowrap">{item.name}</span>
            {item.count && (
              <span className="ml-auto tabular-nums">
                {item.secondaryCount && (
                  <span className="mr-1 text-xs text-gray-400 dark:text-gray-500">
                    {item.secondaryCount}
                  </span>
                )}
                {item.count}
              </span>
            )}
          </Link>
        ))}
      </div>
    </div>
  )
}
