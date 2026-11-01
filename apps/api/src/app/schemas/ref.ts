import { Type, type Static, type TSchema } from 'typebox'

export const schemaRef = <T extends TSchema & object>(schema: T) => {
  if (!('$id' in schema) || typeof schema.$id !== 'string') {
    throw new Error('Referenced schemas must have a string $id')
  }

  // oxlint-disable-next-line no-restricted-properties -- This helper restores the referenced schema's static type.
  return Type.Unsafe<Static<T>>(Type.Ref(schema.$id))
}
