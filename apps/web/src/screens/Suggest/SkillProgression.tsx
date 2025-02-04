import { orderBy, range } from 'lodash-es'
import { useState } from 'react'
import useSWRImmutable from 'swr/immutable'
import { api } from '~/api'
import { Dialog, DialogContent, DialogTrigger } from '~/components/ui/Dialog'
import { Loader } from '~/components/ui/Loader'
import { HelpBubble, Tooltip } from '~/components/ui/Tooltip'
import { cn, formatNumber, pluralize } from '~/utils'

export const SkillProgression = ({
  apiParams,
  isSwrDisabled,
  isLastVersion,
}: {
  apiParams: unknown
  isSwrDisabled: boolean
  isLastVersion: boolean
}) => {
  const [showSkillProgression, setShowSkillProgression] = useState(false)

  const fetchingDisabled = isSwrDisabled || !showSkillProgression
  const isButtonEnabled = isLastVersion || process.env.NODE_ENV === 'development'

  const {
    data: allData,
    error,
    isValidating,
  } = useSWRImmutable(
    () => {
      if (fetchingDisabled) {
        return null
      }

      return ['/suggest/experimental', apiParams]
    },
    ([url, params]) =>
      api
        .get<{
          data: { morgueUrl: string }[]
          averages: {
            [key: string]: {
              dataPoints: number[]
              values: number[]
            }
          }
        }>(url, { params })
        .then((res) => ({
          originalData: res.data,
          normalizedData: Object.keys(res.data.averages).map((skillName) => {
            const data = res.data.averages[skillName]

            const averageValue = calculateAverage(data.values)
            const averageDataPoints = calculateAverage(data.dataPoints)
            const importance = averageValue * averageDataPoints

            return {
              skillName,
              data,
              importance,
            }
          }),
        }))
        .then((data) => ({
          ...data,

          normalizedData: orderBy(data.normalizedData, (item) => item.importance, 'desc'),
        })),
  )

  const data = allData?.normalizedData
  const maxDataPoints = Math.max(...(data?.map((item) => Math.max(...item.data.dataPoints)) ?? []))
  const maxSkillLevel = Math.max(...(data?.map((item) => item.data.values.length) ?? []), 0)

  return (
    <div className="w-full space-y-1 pb-2">
      <div className="flex min-h-8 gap-2">
        <Tooltip
          disabled={isButtonEnabled}
          content="Only available for the last version of the game for now"
        >
          <label className="relative flex cursor-pointer select-none items-center gap-1">
            <input
              checked={showSkillProgression}
              className="cursor-pointer"
              type="checkbox"
              onChange={() => {
                if (!isButtonEnabled) {
                  return
                }
                setShowSkillProgression(!showSkillProgression)
              }}
            />
            Show skill progression
            {isValidating && <Loader />}
          </label>
        </Tooltip>

        {data && data.length > 0 && (
          <Dialog>
            <DialogTrigger asChild>
              <button className="flex items-center gap-1 rounded px-2 py-1 hover:bg-gray-100 dark:hover:bg-zinc-700">
                Show table view
              </button>
            </DialogTrigger>
            <DialogContent title="Skill level progression">
              <table className="text-xs">
                <thead>
                  <tr className="text-right [&>th]:p-1">
                    <th>Skill\XL</th>
                    {range(maxSkillLevel).map((i) => (
                      <th key={i} className="">
                        {i + 1}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="text-right">
                  {data.map((skill) => (
                    <tr key={skill.skillName} className="[&>td]:p-1">
                      <td>{skill.skillName}</td>
                      {skill.data.values.map((value, i) => (
                        <td key={i}>
                          {value
                            ? formatNumber(value, {
                                minimumFractionDigits: 1,
                                maximumFractionDigits: 1,
                              })
                            : ''}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {error && <div className="text-red-500">Error loading skill progression data</div>}
      {data && !data.length && <div>No skill progression data</div>}

      {isValidating && (
        <div className="m-auto w-full rounded bg-blue-100 px-2 py-1 text-sm text-black">
          This feature is experimental and may take up to a minute to load
        </div>
      )}
      {data && data.length > 0 && (
        <>
          <div className="flex items-center gap-1 text-sm">
            Based on {allData.originalData.data.length}{' '}
            {pluralize('win', allData.originalData.data.length)}
            <HelpBubble
              interactive
              content={
                <div>
                  Each skill graph is divided by <b>XL</b> on 27 bars.
                  <br />
                  The <b>height</b> of each bar represents the average skill level of all players
                  who reached that <b>XL</b>.
                  <br />
                  The <b>color</b> of the bar represents the number of players who who had such
                  skill at that <b>XL</b>.
                  <br />
                  <b className="text-green-700">Green</b> means more players.{' '}
                  <b className="text-amber-600">Yellow</b> means fewer players.
                  <br />
                  <br />
                  <b>For example</b>, if the bar is <b>thick</b> and{' '}
                  <b className="text-green-700">green</b>, it means that many players leveled and
                  used a skill.
                  <br />
                  If the bar is <b>thick</b> and <b className="text-amber-600">yellow</b>, it means
                  that only a few players leveled and used a skill.
                  <br />
                  If the bar is <b>thin</b> and <b className="text-amber-600">yellow</b>, it means
                  that almost no one leveled and used a skill.
                </div>
              }
            />
          </div>
          <div className="m-auto grid w-full grid-cols-1 gap-x-2 gap-y-0.5 pt-3 text-xs sm:grid-cols-2">
            {data.map((skill) => (
              <div key={skill.skillName} className="flex items-center gap-2">
                <div className="relative flex h-[28px] flex-1 items-center">
                  <div className="pointer-events-none absolute left-0 top-[-6px]">
                    {skill.skillName}
                  </div>
                  {skill.data.values.map((value, i) => {
                    const dataPoints = skill.data.dataPoints[i]

                    return (
                      <Tooltip
                        key={i}
                        content={
                          <div>
                            <b>XL {i + 1}</b>
                            <div>
                              Skill level: <b>{value}</b>
                            </div>
                            <div>
                              Players reached: <b>{dataPoints}</b>
                            </div>
                          </div>
                        }
                      >
                        <div key={i} className="flex h-full flex-1 items-center">
                          {value > 0 && (
                            <div
                              style={{
                                height: Math.ceil(value),
                              }}
                              className={cn('w-full', {
                                'bg-amber-100': dataPoints,
                                'bg-amber-200': dataPoints >= maxDataPoints * 0.1,
                                'bg-amber-300': dataPoints >= maxDataPoints * 0.25,
                                'bg-green-500': dataPoints >= maxDataPoints * 0.35,
                                'bg-green-400': dataPoints >= maxDataPoints * 0.5,
                                'bg-green-600': dataPoints >= maxDataPoints * 0.7,
                                'bg-green-800': dataPoints >= maxDataPoints * 0.9,
                              })}
                            />
                          )}
                        </div>
                      </Tooltip>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function calculateAverage(values: number[]): number {
  const sum = values.reduce((acc, value) => acc + value, 0)
  return sum / values.length
}
