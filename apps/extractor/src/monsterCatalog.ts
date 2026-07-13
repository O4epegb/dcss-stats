// oxlint-disable no-console
import { execFile } from 'child_process'
import fs from 'fs-extra'
import path from 'path'
import { promisify } from 'util'

const execFileAsync = promisify(execFile)

const CRAWL_DIR = path.resolve(process.cwd(), 'crawl')
const CRAWL_SOURCE_DIR = path.resolve(CRAWL_DIR, 'crawl-ref', 'source')
const MONSTER_EXPORT_UTILITY = path.join(CRAWL_SOURCE_DIR, 'util/monster/monster-export')
const RLTILES_DIR = path.join(CRAWL_SOURCE_DIR, 'rltiles')
const TILE_PLAYER_MANIFEST = path.join(RLTILES_DIR, 'tile-player.html')
const CACHE_DIR = path.resolve(process.cwd(), '.cache')
const MONSTER_CATALOG_FILE = process.env.MONSTER_CATALOG_FILE_PATH
  ? path.resolve(process.cwd(), process.env.MONSTER_CATALOG_FILE_PATH)
  : path.join(CACHE_DIR, 'monsters.json')
const EXEC_BUFFER_BYTES = 1024 * 1024 * 16

export interface MonsterData {
  id: number
  name: string
  symbol: string
  colour?: string
  tile?: string
  tile_path?: string
  speed?: {
    base: number
    energy_costs: {
      move: number
      attack: number
      spell: number
      missile: number
      swim: number
    }
    stationary: boolean
  }
  hd: number | null
  hp: string
  ac: number | null
  ac_sim?: number | null
  ev: number | null
  ev_sim?: number | null
  attacks?: Array<{
    damage: { num: number; size: number }
    type: string
    flavour?: string
    extra_damage?: number
    special?: string
    constrict?: boolean
    claw?: boolean
    reach?: boolean
    per_head?: boolean
  }>
  flags: string[]
  resistances: string[]
  vulnerabilities?: string[]
  corpse: boolean
  xp: number | null
  spells: Array<{
    name: string
    level: number
    mana: number
    freq?: number
    range?: number
    damage?: string
    antimagic?: boolean
    silence?: boolean
    breath?: boolean
    critical?: boolean
  }>
  spell_string?: string
  size: string
  intelligence: string
  defenses?: string[]
  species: string
  genus: string
  willpower?: number
  willpower_invuln?: boolean
  spell_hd: number
  shapeshifter: boolean
  unique?: boolean
  shape: string
  holiness: string
  habitat: string
  shout: string
  uses: string
  resist_levels: Record<string, number>
  locations?: Array<{
    branch: string
    branchAbbrev: string
    minDepth: number
    maxDepth: number
    branchDepth: number
    rarity: number
    distribution: string
    habitat?: 'water' | 'lava'
  }>
  description?: string
  quote?: string
  unfinished?: boolean
}

export interface MonsterCatalog {
  monsters: MonsterData[]
  generatedAt: string
  crawlVersion?: string
  crawlCommit?: string
  listedCount: number
  processedCount: number
  failedCount: number
}

export function getMonsterCatalogPath() {
  return MONSTER_CATALOG_FILE
}

export async function buildMonsterCatalog(): Promise<MonsterCatalog> {
  assertCrawlIsInstalled()

  console.log('Extracting monster catalog from Crawl...')

  const [monsterTilePaths, crawlVersion, crawlCommit] = await Promise.all([
    loadMonsterTilePaths(),
    getCrawlVersion(),
    getCrawlCommit(),
  ])

  console.log('Exporting all monsters from Crawl...')

  const lines = (await runMonsterExport(['--all'])).split('\n').filter(Boolean)

  const monsters: MonsterData[] = []
  let failedCount = 0

  for (const line of lines) {
    const monsterJson = JSON.parse(line) as MonsterData & { error?: string }

    if (monsterJson.error) {
      failedCount++
      console.warn(`Failed to process ${monsterJson.name}: ${monsterJson.error}`)
      continue
    }

    if (monsterJson.tile) {
      const tilePath =
        monsterTilePaths.get(monsterJson.tile) ??
        monsterTilePaths.get(monsterJson.tile.replace(/_\d+$/, ''))

      if (tilePath) {
        monsterJson.tile_path = tilePath
      }
    }

    monsterJson.id = monsters.length
    monsters.push(monsterJson)
  }

  const catalog: MonsterCatalog = {
    monsters,
    generatedAt: new Date().toISOString(),
    crawlVersion,
    crawlCommit,
    listedCount: lines.length,
    processedCount: monsters.length,
    failedCount,
  }

  await fs.ensureDir(CACHE_DIR)
  await fs.writeFile(MONSTER_CATALOG_FILE, `${JSON.stringify(catalog, null, 2)}\n`, 'utf-8')

  console.log(
    `Monster catalog ready: ${catalog.processedCount}/${catalog.listedCount} monsters processed.`,
  )

  return catalog
}

async function loadMonsterTilePaths(): Promise<Map<string, string>> {
  if (!fs.existsSync(TILE_PLAYER_MANIFEST)) {
    throw new Error(`Tile player manifest not found at ${TILE_PLAYER_MANIFEST}`)
  }

  const manifest = await fs.readFile(TILE_PLAYER_MANIFEST, 'utf-8')
  const tilePaths = new Map<string, string>()
  const rowPattern =
    /<tr><td><img src="([^"]+)"\/><\/td><td>[^<]*<\/td><td>(TILEP_[^<]+)<\/td><td>([^<]+)<\/td><\/tr>/g

  let match: RegExpExecArray | null

  while ((match = rowPattern.exec(manifest)) !== null) {
    const imageSrc = match[1]
    const enumName = match[2]
    const tilePath = match[3]

    if (!imageSrc || !enumName) {
      continue
    }

    const normalizedEnum = enumName.replace(/^TILEP_/, '')
    tilePaths.set(normalizedEnum, tilePath || imageSrc)
  }

  return tilePaths
}

async function getCrawlVersion(): Promise<string> {
  const output = await runMonsterExport(['--version'])
  return (JSON.parse(output) as { version: string }).version
}

async function getCrawlCommit(): Promise<string> {
  const result = await execFileAsync('git', ['-C', CRAWL_DIR, 'rev-parse', 'HEAD'], {
    encoding: 'utf-8',
  })
  return result.stdout.trim()
}

async function runMonsterExport(args: string[]): Promise<string> {
  const result = await execFileAsync(MONSTER_EXPORT_UTILITY, args, {
    cwd: CRAWL_SOURCE_DIR,
    encoding: 'utf-8',
    maxBuffer: EXEC_BUFFER_BYTES,
  })

  return result.stdout.trim()
}

function assertCrawlIsInstalled() {
  if (!fs.existsSync(CRAWL_DIR)) {
    throw new Error(
      'Crawl sources not found. Please run yarn workspace @dcss-stats/extractor install-crawl.',
    )
  }

  if (!fs.existsSync(MONSTER_EXPORT_UTILITY)) {
    throw new Error(
      `Monster export utility not found at ${MONSTER_EXPORT_UTILITY}. Please run yarn workspace @dcss-stats/extractor apply-crawl-customizations and yarn workspace @dcss-stats/extractor build-crawl, or just yarn workspace @dcss-stats/extractor all.`,
    )
  }
}
