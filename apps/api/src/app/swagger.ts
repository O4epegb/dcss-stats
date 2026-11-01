import fastifySwagger from '@fastify/swagger'
import fastifyScalarSwaggerUi from '@scalar/fastify-api-reference'
import { AppType } from './app'

export const initSwagger = async (app: AppType) => {
  await app.register(fastifySwagger, {
    refResolver: {
      buildLocalReference: (schema, _baseUri, _fragment, index) =>
        typeof schema.$id === 'string' ? schema.$id : `schema${index}`,
    },
    openapi: {
      openapi: '3.2.1',
      info: {
        title: 'DCSS Stats Swagger API',
        description: 'Scalar Swagger UI for https://dcss-stats.com/',
        version: 'WIP',
      },
    },
  })

  await app.register(fastifyScalarSwaggerUi, {
    routePrefix: '/api/docs',
  })
}
