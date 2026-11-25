import { execFileSync } from 'child_process'
import path from 'path'
import fs from 'fs-extra'
import { logger } from '~/utils'

const CRAWL_REPOSITORY = 'https://github.com/crawl/crawl.git'
const CRAWL_TAG = '0.36-a0'
const CRAWL_COMMIT = '1400eb02e2f6b1260a6016d9d01e14284c6d2b7a'
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
    const tagRef = `refs/tags/${CRAWL_TAG}`
    try {
      execFileSync('git', ['show-ref', '--verify', '--quiet', tagRef], {
        cwd: CRAWL_DIR,
        stdio: 'ignore',
      })
    } catch {
      logger(`Fetching Crawl tag ${CRAWL_TAG}...`)
      execFileSync('git', ['fetch', 'origin', 'tag', CRAWL_TAG], {
        cwd: CRAWL_DIR,
        stdio: 'inherit',
      })
    }

    const taggedCommit = execFileSync('git', ['rev-parse', `${tagRef}^{commit}`], {
      cwd: CRAWL_DIR,
      encoding: 'utf-8',
    }).trim()
    if (taggedCommit !== CRAWL_COMMIT) {
      throw new Error(`Crawl tag ${CRAWL_TAG} points to ${taggedCommit}, expected ${CRAWL_COMMIT}.`)
    }

    logger(`Checking out Crawl tag ${CRAWL_TAG}...`)
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
