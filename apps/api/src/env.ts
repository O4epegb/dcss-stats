import dotenv from 'dotenv'
import path from 'path'

dotenv.config({
  path: path.resolve(
    process.cwd(),
    `.env.${process.env.NODE_ENV === 'production' ? 'production' : 'local'}`,
  ),
})
