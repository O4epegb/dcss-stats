import { errorCodes, type preHandlerAsyncHookHandler } from 'fastify'
import { type TSchema } from 'typebox'
import { Value } from 'typebox/value'

export const validateQuery = <TData extends object>(
  loadData: () => Promise<TData>,
  createSchema: (data: TData) => TSchema,
): preHandlerAsyncHookHandler => {
  const schemas = new WeakMap<TData, TSchema>()

  return async (request) => {
    const data = await loadData()
    let schema = schemas.get(data)
    if (!schema) {
      schema = createSchema(data)
      schemas.set(data, schema)
    }

    const references = request.server.getSchemas() as Record<string, TSchema>
    if (!Value.Check(references, schema, request.query)) {
      const errors = Value.Errors(references, schema, request.query)
      const message = errors
        .map((error) => `querystring${error.instancePath} ${error.message}`)
        .join(', ')
      const error = new errorCodes.FST_ERR_VALIDATION(message || 'Invalid querystring')
      error.validation = errors
      error.validationContext = 'querystring'
      throw error
    }
  }
}
