import { FC } from 'react'
import clsx from 'clsx'

export const Select: FC<React.SelectHTMLAttributes<HTMLSelectElement>> = ({
  className,
  ...props
}) => {
  return (
    <select
      className={clsx(className, 'rounded bg-gray-200 py-1 pl-1 dark:bg-zinc-700')}
      {...props}
    />
  )
}
