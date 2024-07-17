import { Game, Logfile, Server } from '@prisma/client'

export type LogfileWithServer = Logfile & { server: Server }

export type GameWithLogfileAndServer = Game & {
  logfile: LogfileWithServer
}

export type UnpackedArray<T> = T extends (infer U)[] ? U : never
