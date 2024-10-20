import { Tooltip } from '~/components/ui/Tooltip'
import { TooltipTable } from './TooltipTable'
import { usePlayerPageContext } from './context'

export const Badges = () => {
  const { summary, gods, tiamat } = usePlayerPageContext()

  const { isGreat, isGrand, isGreater, isPolytheist, isTiamat } = summary

  return (
    <div className="flex flex-wrap gap-2 text-sm">
      {isGreater ? (
        <Tooltip
          content={
            <div>
              Has won with all races and all classes
              <div className="pt-2 text-xs text-gray-300 dark:text-gray-700">
                Achievements were renamed to Great/Grand/Greater because of <br />
                name clash with Discord command
              </div>
            </div>
          }
        >
          <div className="rounded bg-amber-300 px-1 py-0.5 text-black ring-2 ring-inset ring-amber-600">
            Greater Player
          </div>
        </Tooltip>
      ) : (
        <>
          {isGreat && (
            <Tooltip content="Has won with all races">
              <div className="rounded bg-amber-300 px-1 py-0.5 text-black">Great Player</div>
            </Tooltip>
          )}
          {isGrand && (
            <Tooltip content="Has won with all classes">
              <div className="rounded bg-amber-300 px-1 py-0.5 text-black">Grand Player</div>
            </Tooltip>
          )}
        </>
      )}
      {isPolytheist && (
        <Tooltip interactive content={<TooltipTable title="Has won with all gods:" data={gods} />}>
          <div className="rounded bg-sky-300 px-1 py-0.5 text-black">Polytheist</div>
        </Tooltip>
      )}
      {isTiamat && (
        <Tooltip
          interactive
          content={
            <TooltipTable title="Has won with every Draconian color:" data={tiamat.detailed} />
          }
        >
          <div className="rounded bg-purple-300 px-1 py-0.5 text-black">Tiamat</div>
        </Tooltip>
      )}
    </div>
  )
}
