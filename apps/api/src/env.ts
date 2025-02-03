import path from 'path'
import dotenv from 'dotenv'

dotenv.config({
  path: (process.env.NODE_ENV === 'production'
    ? ['.env.production']
    : ['.env.local', '.env.development']
  ).map((file) => path.resolve(process.cwd(), file)),
})
