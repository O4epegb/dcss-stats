import { memo } from 'react'
import { date } from '@utils'

export const Date = memo(({ value, format }: { value: string; format: string }) => {
  return <span suppressHydrationWarning>{date(value).format(format)}</span>
})
