import { execFileSync } from 'child_process'
import path from 'path'
import fs from 'fs-extra'
import { logger } from '~/utils'

const CRAWL_REPOSITORY = 'https://github.com/crawl/crawl.git'
const CRAWL_COMMIT = '7e0203f8234604c36b3f5f646f2f7c4221005135'
const CRAWL_DIR = path.resolve(process.cwd(), 'crawl')
const CRAWL_SOURCE_DIR = path.resolve(CRAWL_DIR, 'crawl-ref', 'source')
const CRAWL_GIT_DIR = path.join(CRAWL_DIR, '.git')

const CJSON_BASE_URL = 'https://raw.githubusercontent.com/DaveGamble/cJSON/refs/tags/v1.7.19'
const CJSON_DEST_DIR = path.resolve(process.cwd(), 'crawl-customizations', 'contrib', 'cjson')

logger('Installing Crawl sources...')

try {
  if (!fs.existsSync(CRAWL_DIR)) {
    logger(`Cloning Crawl from ${CRAWL_REPOSITORY}...`)
    execFileSync(
      'git',
      ['clone', '--filter=blob:none', '--no-checkout', CRAWL_REPOSITORY, 'crawl'],
      {
        cwd: process.cwd(),
        stdio: 'inherit',
      },
    )
  }

  if (fs.existsSync(CRAWL_GIT_DIR)) {
    try {
      execFileSync('git', ['cat-file', '-e', `${CRAWL_COMMIT}^{commit}`], {
        cwd: CRAWL_DIR,
        stdio: 'ignore',
      })
    } catch {
      logger(`Fetching Crawl commit ${CRAWL_COMMIT}...`)
      execFileSync('git', ['fetch', 'origin', CRAWL_COMMIT], {
        cwd: CRAWL_DIR,
        stdio: 'inherit',
      })
    }

    logger(`Checking out Crawl commit ${CRAWL_COMMIT}...`)
    execFileSync('git', ['checkout', '--detach', CRAWL_COMMIT], {
      cwd: CRAWL_DIR,
      stdio: 'inherit',
    })

    logger('Initializing Crawl submodules...')
    execFileSync('git', ['submodule', 'update', '--init', '--recursive'], {
      cwd: CRAWL_DIR,
      stdio: 'inherit',
    })
  } else {
    logger(
      'Crawl git metadata not found. Skipping submodule initialization and using vendored sources.',
    )
  }

  if (!fs.existsSync(CRAWL_SOURCE_DIR)) {
    throw new Error(`Crawl source directory not found at ${CRAWL_SOURCE_DIR}.`)
  }

  logger('Downloading cJSON v1.7.19...')
  fs.ensureDirSync(CJSON_DEST_DIR)
  execFileSync(
    'curl',
    ['-sfL', `${CJSON_BASE_URL}/cJSON.c`, '-o', path.join(CJSON_DEST_DIR, 'cJSON.c')],
    {
      stdio: 'inherit',
    },
  )
  execFileSync(
    'curl',
    ['-sfL', `${CJSON_BASE_URL}/cJSON.h`, '-o', path.join(CJSON_DEST_DIR, 'cJSON.h')],
    {
      stdio: 'inherit',
    },
  )
  logger('cJSON downloaded successfully.')

  logger('✅ Crawl sources installed successfully!')
  logger('Next steps: run yarn apply-crawl-customizations, then yarn build-crawl.')
} catch (error) {
  console.error('❌ Error installing Crawl:', error)
  process.exit(1)
}
