import { config } from 'dotenv-flow'
import { dirname } from 'path'
import { fileURLToPath } from 'url'
import { spawn } from 'child_process'

const __dirname = dirname(fileURLToPath(import.meta.url))

process.chdir(__dirname + '/..')

const args = process.argv.slice(2)
const nodeEnv = args.shift()
const envs = { dev: 'development', prod: 'production' }

if (!Object.keys(envs).includes(nodeEnv)) {
  process.stderr.write('Usage: prisma [dev|prod] [prisma-commands]\n')
  process.exit(0)
}

process.env['NODE_ENV'] = envs[nodeEnv]

config()

const opts = { stdio: 'inherit' }

if (process.platform === 'win32') {
  spawn('cmd', ['/c', 'node_modules\\.bin\\prisma.cmd', ...args], opts)
} else {
  spawn('../../node_modules/.bin/prisma', args, opts)
}
