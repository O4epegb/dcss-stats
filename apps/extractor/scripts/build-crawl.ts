import { execSync } from 'child_process'
import path from 'path'
import fs from 'fs-extra'
import { logger } from '~/utils'

const CRAWL_DIR = path.resolve(process.cwd(), 'crawl')
const CRAWL_SOURCE_DIR = path.resolve(CRAWL_DIR, 'crawl-ref', 'source')
const MONSTER_EXPORT_SOURCE = path.join(CRAWL_SOURCE_DIR, 'util/monster/monster-export-main.cc')
const MONSTER_EXPORT_UTILITY = path.join(CRAWL_SOURCE_DIR, 'util/monster/monster-export')
const CRAWL_MAKEFILE = path.join(CRAWL_SOURCE_DIR, 'Makefile')

function assertBuildPrerequisites() {
  if (!fs.existsSync(CRAWL_SOURCE_DIR)) {
    throw new Error(
      `Crawl source directory not found at ${CRAWL_SOURCE_DIR}. Run yarn install-crawl first.`,
    )
  }

  if (!fs.existsSync(MONSTER_EXPORT_SOURCE)) {
    throw new Error(
      `Monster export source not found at ${MONSTER_EXPORT_SOURCE}. Run yarn apply-crawl-customizations first.`,
    )
  }

  const makefile = fs.readFileSync(CRAWL_MAKEFILE, 'utf-8')

  if (!makefile.includes('monster-export: util/monster/monster-export')) {
    throw new Error(
      'Crawl Makefile is missing monster-export target. Run yarn apply-crawl-customizations first.',
    )
  }
}

try {
  assertBuildPrerequisites()

  logger('Building Crawl monster export utility...')
  execSync('make monster-export -j4 TILES=y', {
    cwd: CRAWL_SOURCE_DIR,
    stdio: 'inherit',
  })

  logger('✅ Crawl monster export utility built successfully!')
  logger(`Monster export utility is available at: ${MONSTER_EXPORT_UTILITY}`)
} catch (error) {
  console.error('❌ Error building Crawl monster export utility:', error)
  process.exit(1)
}
