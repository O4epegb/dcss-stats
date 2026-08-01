import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { FC, ReactNode } from 'react'
import { cn } from '~/utils'

export const SortableItem: FC<{ id: string; className: string; children: ReactNode }> = ({
  id,
  className,
  children,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div ref={setNodeRef} style={style} className={cn(className, 'relative', isDragging && 'z-10')}>
      <button
        {...attributes}
        {...listeners}
        className={cn(
          isDragging ? 'cursor-grabbing' : 'cursor-grab',
          'text-muted-foreground hover:bg-surface-active hover:text-foreground absolute right-full mr-1 flex h-6 w-6 items-center justify-center rounded-sm transition-colors',
        )}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="9" cy="12" r="1"></circle>
          <circle cx="9" cy="5" r="1"></circle>
          <circle cx="9" cy="19" r="1"></circle>
          <circle cx="15" cy="12" r="1"></circle>
          <circle cx="15" cy="5" r="1"></circle>
          <circle cx="15" cy="19" r="1"></circle>
        </svg>
      </button>
      {children}
    </div>
  )
}
