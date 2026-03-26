import path from 'path'
import type { MonsterCatalog } from '@dcss-stats/extractor/monsterCatalog'
import fse from 'fs-extra'
import { AppType } from '~/app/app'

const MONSTER_CATALOG_FILE = process.env.MONSTER_CATALOG_FILE_PATH
  ? path.resolve(process.cwd(), process.env.MONSTER_CATALOG_FILE_PATH)
  : path.join(process.cwd(), '.cache', 'monsters.json')

let inMemoryCatalog: MonsterCatalog | null = null

export const monstersRoute = (app: AppType) => {
  app.get('/api/monsters', async () => {
    if (!inMemoryCatalog) {
      inMemoryCatalog = await readMonsterCatalogFromDisk()
    }

    return inMemoryCatalog
  })
}

async function readMonsterCatalogFromDisk(): Promise<MonsterCatalog> {
  if (!(await fse.pathExists(MONSTER_CATALOG_FILE))) {
    throw new Error(`Monster catalog file not found at ${MONSTER_CATALOG_FILE}`)
  }

  const fileContents = await fse.readJSON(MONSTER_CATALOG_FILE, 'utf-8')
  return fileContents as MonsterCatalog
}
