import path from 'path'
import dotenv from 'dotenv'

dotenv.config({
  path: path.resolve(
    process.cwd(),
    `.env.${process.env.NODE_ENV === 'production' ? 'production' : 'local'}`,
  ),
})
