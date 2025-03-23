import { spawn } from 'child_process'
import { dirname } from 'path'
import { fileURLToPath } from 'url'
import { config } from 'dotenv-flow'

const __dirname = dirname(fileURLToPath(import.meta.url))

process.chdir(__dirname + '/..')

const args = process.argv.slice(2)
const nodeEnv = args.shift() ?? ''
const envs = { dev: 'development', prod: 'production' }

if (!Object.keys(envs).includes(nodeEnv)) {
  process.stderr.write('Usage: prisma [dev|prod] [prisma-commands]\n')
  process.exit(0)
}

// @ts-expect-error string index signature
process.env['NODE_ENV'] = envs[nodeEnv]

config()

if (process.platform === 'win32') {
  spawn('cmd', ['/c', 'node_modules\\.bin\\prisma.cmd', ...args], { stdio: 'inherit' })
} else {
  spawn('../../node_modules/.bin/prisma', args, {
    stdio: 'inherit',
  })
}
