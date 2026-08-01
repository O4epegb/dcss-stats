import { ReactNode } from 'react'
import { Tooltip } from '~/components/ui/Tooltip'
import { usePlayerPageContext } from './context'
import { TooltipTable } from './TooltipTable'

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
      <div className="bg-surface-emphasis relative overflow-hidden rounded-sm px-1 py-0.5">
        <div
          className="bg-surface-active absolute top-0 bottom-0 left-0"
          style={{
            width: `${(completed / total) * 100}%`,
          }}
        />
        <span className="relative z-1">
          {title} {completed} of {total}
        </span>
      </div>
    </Tooltip>
  )
}
