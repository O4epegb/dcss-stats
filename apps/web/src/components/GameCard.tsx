import clsx from 'clsx'
import { first, without } from 'lodash-es'
import { forwardRef, memo } from 'react'
import { Game } from '~/types'
import { pluralize, date, formatNumber, getMorgueUrl } from '~/utils'

type Props = {
  game: Game
  includePlayer?: boolean
  shadow?: boolean
  showSkills?: boolean
  size?: 'full' | 'compact'
}

export const GameCard = memo(
  forwardRef<HTMLDivElement, Props>(({ size = 'full', ...props }, ref) => {
    return size === 'full' ? (
      <GameItemFull ref={ref} {...props} />
    ) : (
      <CompactGameItem ref={ref} {...props} />
    )
  }),
)

const GameItemFull = memo(
  forwardRef<HTMLDivElement, Props>(({ game, includePlayer, shadow, showSkills }, ref) => {
    const duration = date.duration(game.duration, 'seconds')

    const skills = showSkills
      ? without(game.fifteenskills, ...game.maxskills)
          .map((name) => ({ name, isMax: false }))
          .concat(game.maxskills.map((name) => ({ name, isMax: true })))
          .sort((a, b) => a.name.localeCompare(b.name))
      : []

    return (
      <div
        ref={ref}
        className={clsx(
          'flex-1 rounded-sm border border-gray-200 bg-white px-2 py-1 text-sm text-black dark:border-gray-300 dark:bg-zinc-900 dark:text-white',
          game.isWin && 'border-l-2 border-l-emerald-500 dark:border-l-emerald-400',
          shadow && 'shadow-md',
        )}
      >
        <div className="font-medium">
          <MorgueLink game={game} />
          {includePlayer && (
            <div>
              <a className="font-medium" href={`/players/${game.name}`}>
                {game.name}
              </a>
            </div>
          )}
          {game.race} {game.class} <span className="font-light">the {game.title}</span>
        </div>

        <div>
          XL:{game.xl},{' '}
          <span className={clsx(game.isWin ? 'text-emerald-500' : 'text-red-500')}>
            {game.endMessage}
          </span>{' '}
          {!game.isWin && game.lvl > 0 && (
            <span>
              in {game.branch}:{game.lvl}{' '}
            </span>
          )}
          {game.uniqueRunes > 0 && (
            <span className="text-indigo-600 dark:text-indigo-400">
              {game.isWin ? 'and' : 'with'} {game.uniqueRunes} {pluralize('rune', game.uniqueRunes)}
            </span>
          )}
          {game.gems > 0 && (
            <span className="text-indigo-600 dark:text-indigo-400">
              {' '}
              {game.uniqueRunes === 0 ? 'with' : 'and'} {game.gems} {pluralize('gem', game.gems)}
            </span>
          )}
          {(game.uniqueRunes > 0 || game.gems > 0) && '!'}
        </div>
        <div>
          {game.god ? (
            <>
              <span className="font-light">Was {getPietyLevel(game.piety, game.god)} of</span>{' '}
              {game.god}
            </>
          ) : (
            'Was an Atheist'
          )}
        </div>
        <div>
          <span className="text-red-800 dark:text-red-300">str:{game.str}</span>{' '}
          <span className="text-blue-800 dark:text-blue-300">int:{game.int}</span>{' '}
          <span className="text-green-800 dark:text-green-300">dex:{game.dex}</span>{' '}
          {game.ac != null && (
            <span className="text-yellow-800 dark:text-yellow-300">ac:{game.ac}</span>
          )}{' '}
          {game.ev != null && (
            <span className="text-violet-800 dark:text-violet-300">ev:{game.ev}</span>
          )}{' '}
          {game.sh != null && <span className="text-sky-800 dark:text-sky-300">sh:{game.sh}</span>}
        </div>
        {skills.length > 0 && (
          <div className="flex flex-wrap gap-x-2">
            {skills.map(({ name, isMax }) => (
              <div
                key={name}
                className={clsx(
                  isMax ? 'text-amber-700 dark:text-amber-600' : 'text-gray-700 dark:text-gray-100',
                )}
              >
                {name}
              </div>
            ))}
          </div>
        )}
        <div className="flex justify-between gap-2 pt-0.5 text-xs text-gray-400 dark:text-gray-300">
          <div>
            {formatNumber(game.score)} score points, {formatNumber(game.turns)} turns, lasted for{' '}
            {duration.format('D') !== '0' && (
              <>
                <span>{duration.format('D')} day</span> and{' '}
              </>
            )}
            {duration.format('HH:mm:ss')}
          </div>
          <ServerLink game={game} />
        </div>
        <div className="flex justify-between gap-2 pt-0.5 text-xs text-gray-400 dark:text-gray-300">
          <TimeAndVersion game={game} />
        </div>
      </div>
    )
  }),
)

const CompactGameItem = forwardRef<HTMLDivElement, Props>(({ game }, ref) => {
  const duration = date.duration(game.duration, 'seconds')

  return (
    <div ref={ref} className="flex-1 py-0.5">
      <div className="text-sm">
        <MorgueLink game={game} />
        {game.char}
        {game.god && <span className="font-light"> of {game.god}</span>},{' '}
        <span className={clsx(game.isWin ? 'text-emerald-500' : 'text-red-500')}>
          {game.isWin ? 'escaped' : game.endMessage}
        </span>{' '}
        {!game.isWin && game.lvl > 0 && (
          <span>
            in {game.branch}:{game.lvl}{' '}
          </span>
        )}
        {game.uniqueRunes > 0 && (
          <span className="text-indigo-600 dark:text-indigo-400">
            with {game.uniqueRunes} {pluralize('rune', game.uniqueRunes)}
          </span>
        )}
        {game.gems > 0 && (
          <span className="text-indigo-600 dark:text-indigo-400">
            {' '}
            {game.uniqueRunes === 0 ? 'with' : 'and'} {game.gems} {pluralize('gem', game.gems)}
          </span>
        )}
        {(game.uniqueRunes > 0 || game.gems > 0) && '!'}
      </div>
      <div className="flex justify-between gap-2 text-xs text-gray-400">
        XL:{game.xl}; score {formatNumber(game.score)}; turns {formatNumber(game.turns)}; lasted for{' '}
        {duration.format('D') !== '0' && (
          <>
            <span>{duration.format('D')} day</span> and{' '}
          </>
        )}
        {duration.format('HH:mm:ss')}
        <ServerLink game={game} />
      </div>
      <div className="flex justify-between gap-2 text-xs text-gray-400">
        <TimeAndVersion compact game={game} />
      </div>
    </div>
  )
})

const format = 'DD MMM YYYY [at] HH:mm:ss'
const TimeAndVersion = ({ compact, game }: { compact?: boolean; game: Game }) => {
  if (!game.server) {
    return null
  }

  const start = date(game.startAt).format(format)
  const end = date(game.endAt).format(format)

  return (
    <>
      <div suppressHydrationWarning title={`Start: ${start}\nEnd: ${end}`}>
        {!compact && <>{date(game.endAt).fromNow()}, </>} {end}
      </div>
      <div>v{game.version}</div>
    </>
  )
}

const ServerLink = ({ game }: { game: Game }) => {
  if (!game.server) {
    return null
  }

  return (
    <a
      target="_blank"
      href={game.server.url}
      title={`Server: ${game.server.name}\n${game.server.url}`}
      rel="noopener noreferrer"
      className="underline"
    >
      {game.server.abbreviation}
    </a>
  )
}

const MorgueLink = ({ game }: { game: Game }) => {
  if (!game.server) {
    return null
  }

  return (
    <a
      className="float-right h-5 w-5"
      target="_blank"
      rel="noopener noreferrer"
      title="Morgue"
      href={getMorgueUrl(game.server.morgueUrl, game)}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-5 w-5"
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
        <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
      </svg>
    </a>
  )
}

const breakpoints = [30, 50, 75, 100, 120, 160]
const ranks = ['an Initiate', 'a Follower', 'a Believer', 'a Priest', 'an Elder', 'a High Priest']
const xomBreakpoints = [20, 50, 80, 120, 150, 180]
const xomRanks = [
  'a very special plaything',
  'a special plaything',
  'a plaything',
  'a toy',
  'a favourite toy',
  'a beloved toy',
]

const getPietyLevel = (piety: number | null, god?: string) => {
  if (god === 'Gozag') {
    return 'a Client'
  }

  if (god === 'Xom') {
    return getPietyLevelGeneric(piety, xomRanks, xomBreakpoints, 'a teddy bear')
  }

  return getPietyLevelGeneric(piety, ranks, breakpoints, 'the Champion')
}

const getPietyLevelGeneric = (
  piety: number | null,
  ranks: string[],
  breakpoints: number[],
  lastRank: string,
) => {
  if (!piety) {
    return first(ranks)
  }

  for (let i = 0; i < breakpoints.length; i++) {
    if (piety < breakpoints[i]) {
      return ranks[i]
    }
  }

  return lastRank
}
