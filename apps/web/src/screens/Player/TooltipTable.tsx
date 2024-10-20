import { ReactNode } from 'react'
import { Tooltip } from '~/components/ui/Tooltip'
import { formatNumber } from '~/utils'

export const TooltipTable = ({
  title,
  data,
}: {
  title: ReactNode
  data: Array<{
    name: string
    wins: number
    games: number
    gamesToFirstWin: number
  }>
}) => {
  const wonItems = data.filter((item) => item.wins > 0)

  if (wonItems.length === 0) {
    return null
  }

  return (
    <>
      <div>{title}</div>
      <table className="mt-2">
        <thead>
          <tr>
            <th></th>
            <th className="px-1 py-0 text-right font-medium">W</th>
            <th className="px-1 py-0 text-right font-medium">G</th>
            <th className="px-1 py-0 text-right font-medium">
              <Tooltip content="First win after X games">
                <span>FW</span>
              </Tooltip>
            </th>
            <th className="px-1 py-0 text-right font-medium">WR</th>
          </tr>
        </thead>
        <tbody>
          {wonItems.map((item) => (
            <tr key={item.name}>
              <td className="py-0">{item.name}</td>
              <td className="px-1 py-0 text-right tabular-nums">{item.wins}</td>
              <td className="px-1 py-0 text-right tabular-nums">{item.games}</td>
              <td className="px-1 py-0 text-right tabular-nums">{item.gamesToFirstWin}</td>
              <td className="px-1 py-0 text-right tabular-nums">
                {formatNumber((item.wins / item.games || 0) * 100, {
                  maximumFractionDigits: 2,
                })}
                %
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  )
}
