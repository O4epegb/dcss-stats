import { Type } from 'typebox'

export const ApiError = Type.Object(
  {
    statusCode: Type.Integer(),
    error: Type.String(),
    message: Type.String(),
    code: Type.Optional(Type.String()),
  },
  { $id: 'ApiError' },
)
