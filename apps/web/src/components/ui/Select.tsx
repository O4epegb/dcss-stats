import { FC } from 'react'
import { cn } from '~/utils'

export const Select: FC<React.SelectHTMLAttributes<HTMLSelectElement>> = ({
  className,
  ...props
}) => {
  return <select className={cn('bg-surface-emphasis rounded-sm py-1 pl-1', className)} {...props} />
}
