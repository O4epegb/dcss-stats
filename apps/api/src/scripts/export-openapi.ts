import { writeFile } from 'node:fs/promises'
import { app } from '~/app'

const methods = ['get', 'put', 'post', 'delete', 'options', 'head', 'patch', 'trace'] as const

try {
  await app.ready()
  const document = app.swagger()
  if (!('openapi' in document)) {
    throw new Error('Expected an OpenAPI document')
  }

  const paths: typeof document.paths = { ...document.paths }
  for (const [url, path] of Object.entries(paths)) {
    if (!path) continue
    const exportedPath = { ...path }
    for (const method of methods) {
      const operation = path[method]
      if (!operation?.operationId) {
        delete exportedPath[method]
        continue
      }

      const hasSuccessSchema = Object.entries(operation.responses ?? {}).some(
        ([status, response]) =>
          /^2\d\d$|^2XX$/.test(status) &&
          'content' in response &&
          Object.values(response.content ?? {}).some((media) => media.schema !== undefined),
      )
      if (!hasSuccessSchema) {
        throw new Error(`${operation.operationId} must declare a success response schema`)
      }
    }
    if (methods.some((method) => exportedPath[method])) {
      paths[url] = exportedPath
    } else {
      delete paths[url]
    }
  }

  await writeFile(
    new URL('../../openapi.json', import.meta.url),
    JSON.stringify({ ...document, paths }, null, 2) + '\n',
  )
} finally {
  await app.close()
}
