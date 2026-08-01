import { first, without } from 'lodash-es'
import { forwardRef, memo } from 'react'
import { Game } from '~/types'
import { cn, date, formatNumber, getMorgueUrl, pluralize } from '~/utils'

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
        className={cn(
          'border-border bg-surface text-foreground flex-1 rounded-sm border px-2 py-1 text-sm',
          game.isWin && 'border-l-success border-l-2',
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
          <span className={game.isWin ? 'text-success' : 'text-danger'}>{game.endMessage}</span>{' '}
          {!game.isWin && game.lvl > 0 && (
            <span>
              in {game.branch}:{game.lvl}{' '}
            </span>
          )}
          {game.uniqueRunes > 0 && (
            <span className="text-special">
              {game.isWin ? 'and' : 'with'} {game.uniqueRunes} {pluralize('rune', game.uniqueRunes)}
            </span>
          )}
          {game.gems > 0 && (
            <span className="text-special">
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
          <span className="text-attribute-strength">str:{game.str}</span>{' '}
          <span className="text-attribute-intelligence">int:{game.int}</span>{' '}
          <span className="text-attribute-dexterity">dex:{game.dex}</span>{' '}
          {game.ac != null && <span className="text-attribute-armour">ac:{game.ac}</span>}{' '}
          {game.ev != null && <span className="text-attribute-evasion">ev:{game.ev}</span>}{' '}
          {game.sh != null && <span className="text-attribute-shield">sh:{game.sh}</span>}
        </div>
        {skills.length > 0 && (
          <div className="flex flex-wrap gap-x-2">
            {skills.map(({ name, isMax }) => (
              <div key={name} className={isMax ? 'text-warning' : 'text-foreground'}>
                {name}
              </div>
            ))}
          </div>
        )}
        <div className="text-muted-foreground flex justify-between gap-2 pt-0.5 text-xs">
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
        <div className="text-muted-foreground flex justify-between gap-2 pt-0.5 text-xs">
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
        <span className={game.isWin ? 'text-success' : 'text-danger'}>
          {game.isWin ? 'escaped' : game.endMessage}
        </span>{' '}
        {!game.isWin && game.lvl > 0 && (
          <span>
            in {game.branch}:{game.lvl}{' '}
          </span>
        )}
        {game.uniqueRunes > 0 && (
          <span className="text-special">
            with {game.uniqueRunes} {pluralize('rune', game.uniqueRunes)}
          </span>
        )}
        {game.gems > 0 && (
          <span className="text-special">
            {' '}
            {game.uniqueRunes === 0 ? 'with' : 'and'} {game.gems} {pluralize('gem', game.gems)}
          </span>
        )}
        {(game.uniqueRunes > 0 || game.gems > 0) && '!'}
      </div>
      <div className="text-muted-foreground flex justify-between gap-2 text-xs">
        XL:{game.xl}; score {formatNumber(game.score)}; turns {formatNumber(game.turns)}; lasted for{' '}
        {duration.format('D') !== '0' && (
          <>
            <span>{duration.format('D')} day</span> and{' '}
          </>
        )}
        {duration.format('HH:mm:ss')}
        <ServerLink game={game} />
      </div>
      <div className="text-muted-foreground flex justify-between gap-2 text-xs">
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
