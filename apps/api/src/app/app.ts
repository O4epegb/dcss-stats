import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox'
import fastify from 'fastify'
import qs from 'qs'

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
      keywords: ['kind', 'modifier'],
    },
  },
}).withTypeProvider<TypeBoxTypeProvider>()

export type AppType = typeof app
