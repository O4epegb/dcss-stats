import path from 'path'
import fs from 'fs-extra'
import { getMonsterCatalogPath } from '~/monsterCatalog'
import { logger } from '~/utils'

const API_CATALOG_FILE = path.resolve(process.cwd(), '..', 'api', '.cache', 'monsters.json')

const catalogPath = getMonsterCatalogPath()

if (!fs.existsSync(catalogPath)) {
  logger(`Monster catalog not found at ${catalogPath}. Run yarn extract-monsters first.`)
  process.exit(1)
}

fs.ensureDirSync(path.dirname(API_CATALOG_FILE))
fs.copySync(catalogPath, API_CATALOG_FILE)
logger(`✅ Copied monster catalog to ${API_CATALOG_FILE}`)
