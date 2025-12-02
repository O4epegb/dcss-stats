import { Logfile, Server, Game } from '~/generated/prisma/client/client'

export type LogfileWithServer = Logfile & { server: Server }

export type GameWithLogfileAndServer = Game & {
  logfile: LogfileWithServer
}

export type UnpackedArray<T> = T extends (infer U)[] ? U : never
