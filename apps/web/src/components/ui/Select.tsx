import clsx from 'clsx'
import { FC } from 'react'

export const Select: FC<React.SelectHTMLAttributes<HTMLSelectElement>> = ({
  className,
  ...props
}) => {
  return (
    <select
      className={clsx(className, 'rounded-sm bg-gray-200 py-1 pl-1 dark:bg-zinc-700')}
      {...props}
    />
  )
}
