import { execSync } from 'child_process'
import path from 'path'
import fs from 'fs-extra'
import { logger } from '~/utils'

const CRAWL_REPOSITORY = 'https://github.com/crawl/crawl.git'
const CRAWL_COMMIT = '9261420e9b7a3246420c534c70f4b09402a670ab'
const CRAWL_DIR = path.resolve(process.cwd(), 'crawl')
const CRAWL_SOURCE_DIR = path.resolve(CRAWL_DIR, 'crawl-ref', 'source')
const CRAWL_GIT_DIR = path.join(CRAWL_DIR, '.git')

const CJSON_BASE_URL = 'https://raw.githubusercontent.com/DaveGamble/cJSON/refs/tags/v1.7.19'
const CJSON_DEST_DIR = path.resolve(process.cwd(), 'crawl-customizations', 'contrib', 'cjson')

logger('Installing Crawl sources...')

if (!fs.existsSync(CRAWL_DIR)) {
  logger(`Cloning Crawl from ${CRAWL_REPOSITORY}...`)
  execSync(`git clone --filter=blob:none --no-checkout ${CRAWL_REPOSITORY} crawl`, {
    cwd: process.cwd(),
    stdio: 'inherit',
  })

  logger(`Checking out Crawl commit ${CRAWL_COMMIT}...`)
  execSync(`git -c advice.detachedHead=false checkout ${CRAWL_COMMIT}`, {
    cwd: CRAWL_DIR,
    stdio: 'inherit',
  })
}

if (!fs.existsSync(CRAWL_SOURCE_DIR)) {
  logger(`Crawl source directory not found at ${CRAWL_SOURCE_DIR}.`)
  process.exit(1)
}

try {
  if (fs.existsSync(CRAWL_GIT_DIR)) {
    logger('Initializing Crawl submodules...')
    execSync('git submodule update --init --recursive', {
      cwd: CRAWL_DIR,
      stdio: 'inherit',
    })
  } else {
    logger(
      'Crawl git metadata not found. Skipping submodule initialization and using vendored sources.',
    )
  }

  logger('Downloading cJSON v1.7.19...')
  fs.ensureDirSync(CJSON_DEST_DIR)
  execSync(`curl -sfL ${CJSON_BASE_URL}/cJSON.c -o ${path.join(CJSON_DEST_DIR, 'cJSON.c')}`, {
    stdio: 'inherit',
  })
  execSync(`curl -sfL ${CJSON_BASE_URL}/cJSON.h -o ${path.join(CJSON_DEST_DIR, 'cJSON.h')}`, {
    stdio: 'inherit',
  })
  logger('cJSON downloaded successfully.')

  logger('✅ Crawl sources installed successfully!')
  logger('Next steps: run yarn apply-crawl-customizations, then yarn build-crawl.')
} catch (error) {
  console.error('❌ Error installing Crawl:', error)
  process.exit(1)
}
