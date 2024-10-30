import path from 'path'
import dayjs from 'dayjs'
import utcPlugin from 'dayjs/plugin/utc'
import fse from 'fs-extra'
import { GameWithLogfileAndServer } from '~/types'

dayjs.extend(utcPlugin)

const getMorgueFullUrl = (morgueUrl: string, game: GameWithLogfileAndServer) => {
  return `${morgueUrl}/${game.name}/${getMorgueFileName(game)}`
}

const getMorgueFileName = (game: GameWithLogfileAndServer) => {
  return `morgue-${game.name}-${dayjs(game.endAt).utc().format('YYYYMMDD-HHmmss')}.txt`
}

export const getRemoteMorguePath = (game: GameWithLogfileAndServer) => {
  if (game.logfile.server.morgueUrl) {
    return getMorgueFullUrl(game.logfile.server.morgueUrl, game)
  }

  throw new Error('No morgueUrl')
}

export const getLocalMorguePath = (game: GameWithLogfileAndServer) => {
  return path.resolve(
    process.cwd(),
    'morgues',
    game.logfile.server.abbreviation,
    `${game.logfile.server.abbreviation}-${game.logfile.version}`,
    game.name.toLowerCase(),
    getMorgueFileName(game),
  )
}

export const fetchMorgueFile = async (remoteUrl: string, localUrl: string) => {
  console.log(`fetchMorgueFile: starting ${remoteUrl}`)

  const startTime = dayjs()
  const res = await fetch(remoteUrl)

  if (res.ok) {
    const text = await res.text()

    await fse.ensureFile(localUrl)
    await fse.writeFile(localUrl, text)

    console.log(
      `fetchMorgueFile: finished in ${dayjs().diff(
        startTime,
        'ms',
      )}ms, ${remoteUrl} downloaded to ${localUrl}`,
    )
  } else {
    if (res.status === 404) {
      await fse.ensureFile(localUrl)
    }

    console.error(`fetchMorgueFile: failed (${res.status}) ${remoteUrl} to ${localUrl}`)
  }
}
