import fastifySwagger from '@fastify/swagger'
import fastifyScalarSwaggerUi from '@scalar/fastify-api-reference'
import { AppType } from './app'

export const initSwagger = async (app: AppType) => {
  await app.register(fastifySwagger, {
    openapi: {
      openapi: '3.0.0',
      info: {
        title: 'DCSS Stats Swagger API',
        description: 'Scalar Swagger UI for https://dcss-stats.vercel.app/',
        version: 'WIP',
      },
    },
  })

  await app.register(fastifyScalarSwaggerUi, {
    routePrefix: '/api/docs',
  })
}
