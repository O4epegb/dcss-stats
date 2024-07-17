import fastify from 'fastify'
import qs from 'qs'
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox'

export const app = fastify({
  logger: true,
  querystringParser: (query) => qs.parse(query),
  ajv: {
    customOptions: {
      strict: 'log',
      keywords: ['kind', 'modifier'],
    },
  },
}).withTypeProvider<TypeBoxTypeProvider>()

export type AppType = typeof app
