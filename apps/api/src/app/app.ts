import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox'
import fastify from 'fastify'
import qs from 'qs'
import { ApiError } from './schemas/api-error'
import { Game } from './schemas/game'

export const app = fastify({
  logger: true,
  routerOptions: {
    ignoreDuplicateSlashes: true,
    ignoreTrailingSlash: true,
    querystringParser: (query) => qs.parse(query),
  },
  ajv: {
    customOptions: {
      strict: 'log',
    },
  },
}).withTypeProvider<TypeBoxTypeProvider>()

app.addSchema(Game)
app.addSchema(ApiError)

export type AppType = typeof app
