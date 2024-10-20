import { ReactNode } from 'react'
import { Tooltip } from '~/components/ui/Tooltip'
import { TooltipTable } from './TooltipTable'
import { usePlayerPageContext } from './context'

export const ProgressBadges = () => {
  const { gods, tiamat, summary } = usePlayerPageContext()

  const {
    trunkClasses,
    trunkRaces,
    wonRaces,
    wonClasses,
    wonGods,
    notWonClasses,
    notWonGods,
    notWonRaces,
    isGreat,
    isGrand,
    isPolytheist,
    isTiamat,
  } = summary

  return (
    <section className="flex flex-row flex-wrap items-start gap-2 text-xs empty:hidden">
      {!isGreat && (
        <Badge
          title="Great Player"
          total={trunkRaces.length}
          completed={wonRaces.length}
          leftToWinWith={notWonRaces}
        />
      )}
      {!isGrand && (
        <Badge
          title="Grand Player"
          total={trunkClasses.length}
          completed={wonClasses.length}
          leftToWinWith={notWonClasses}
        />
      )}
      {!isPolytheist && (
        <Badge
          title="Polytheist"
          total={gods.length}
          completed={wonGods.length}
          leftToWinWith={notWonGods}
          additionalContent={<TooltipTable title="Already won:" data={gods} />}
        />
      )}
      {!isTiamat && (
        <Badge
          title="Tiamat"
          total={tiamat.total}
          completed={tiamat.total - tiamat.unwon.length}
          leftToWinWith={tiamat.detailed.filter((drac) => drac.wins === 0)}
          additionalContent={<TooltipTable title="Already won:" data={tiamat.detailed} />}
        />
      )}
    </section>
  )
}

const Badge = ({
  open,
  completed,
  total,
  leftToWinWith,
  title,
  additionalContent,
}: {
  open?: boolean
  completed: number
  total: number
  leftToWinWith?: Array<{ name: string; games?: number }>
  title: string
  additionalContent?: ReactNode
}) => {
  return (
    <Tooltip
      interactive
      open={open}
      disabled={!leftToWinWith}
      content={
        <div className="space-y-2">
          <div>Need to win with:</div>
          {leftToWinWith && (
            <ul>
              {leftToWinWith.map((item) => (
                <li key={item.name}>
                  {item.name}
                  {item.games !== undefined && <span>: {item.games}G</span>}
                </li>
              ))}
            </ul>
          )}
          {additionalContent}
        </div>
      }
    >
      <div className="relative overflow-hidden rounded bg-gray-100 px-1 py-0.5 dark:bg-zinc-700">
        <div
          className="absolute bottom-0 left-0 top-0 bg-gray-200 dark:bg-zinc-600"
          style={{
            width: `${(completed / total) * 100}%`,
          }}
        />
        <span className="relative z-[1]">
          {title} {completed} of {total}
        </span>
      </div>
    </Tooltip>
  )
}
