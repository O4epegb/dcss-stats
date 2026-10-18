import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { data } from '../../api/prisma/seedData'
import { logger } from '~/utils'

interface Dimension {
  abbr: string
  name: string
  derives?: string
}

interface PlayableMetadata {
  species: Dimension[]
  jobs: Dimension[]
  combos: string[]
}

function getPlayableMetadata(jsonFile?: string): PlayableMetadata {
  let json: string

  if (jsonFile) {
    logger(`Checking playable data from ${path.resolve(jsonFile)}`)
    json = readFileSync(jsonFile, 'utf-8')
  } else {
    const extractorDir = fileURLToPath(new URL('../', import.meta.url))
    execFileSync('yarn', ['install-crawl'], { cwd: extractorDir, stdio: 'inherit' })
    const sourceDir = path.join(extractorDir, 'crawl', 'crawl-ref', 'source')

    // Rebuild so a binary left over from an older checkout cannot silently pass.
    execFileSync('make', ['crawl', '-j4', 'TILES=y'], { cwd: sourceDir, stdio: 'inherit' })
    const binary = path.join(sourceDir, 'crawl')
    const version = execFileSync(binary, ['-version'], { cwd: sourceDir, encoding: 'utf-8' })
    logger(`Checking ${version.split('\n')[0]}`)
    json = execFileSync(binary, ['-playable-json'], { cwd: sourceDir, encoding: 'utf-8' })
  }

  const metadata = JSON.parse(json) as PlayableMetadata
  if (
    !metadata ||
    !Array.isArray(metadata.species) ||
    !Array.isArray(metadata.jobs) ||
    !Array.isArray(metadata.combos) ||
    !metadata.species.length ||
    !metadata.jobs.length ||
    !metadata.combos.length
  ) {
    throw new Error(
      'Expected non-empty species, jobs, and combos arrays from crawl -playable-json.',
    )
  }
  return metadata
}

function checkDimensions(
  label: string,
  hardcoded: readonly (readonly [string, string, boolean?])[],
  expected: Dimension[],
  issues: string[],
) {
  const seen = new Set<string>()
  for (const [abbr] of hardcoded) {
    if (seen.has(abbr)) issues.push(`Duplicate backend ${label} abbreviation: ${abbr}`)
    seen.add(abbr)
  }

  const current = new Map(
    hardcoded.filter(([, , trunk = true]) => trunk).map(([abbr, name]) => [abbr, name]),
  )
  const upstream = new Map(expected.map(({ abbr, name }) => [abbr, name]))

  for (const [abbr, name] of upstream) {
    const actual = current.get(abbr)
    if (actual === undefined) {
      issues.push(`Missing backend trunk ${label}: ${abbr} (${name}); add it or set trunk=true.`)
    } else if (actual !== name) {
      issues.push(`Backend ${label} ${abbr}: expected name "${name}", found "${actual}".`)
    }
  }
  for (const [abbr, name] of current) {
    if (!upstream.has(abbr)) {
      issues.push(`Backend ${label} is no longer in trunk: ${abbr} (${name}); set trunk=false.`)
    }
  }
}

function main() {
  const args = process.argv.slice(2)
  if (args.length > 1 || args[0]?.startsWith('-')) {
    throw new Error('Usage: yarn check-trunk-data [path/to/playable.json]')
  }

  const metadata = getPlayableMetadata(args[0])
  const unavailableCombos = JSON.parse(
    readFileSync(
      new URL('../../web/src/screens/Player/unavailableCombos.json', import.meta.url),
      'utf-8',
    ),
  ) as string[]
  // The species array also contains coloured Draconian forms, which cannot start games.
  const species = metadata.species.filter(({ derives }) => derives === undefined)
  const issues: string[] = []
  checkDimensions('species', data.races, species, issues)
  checkDimensions('background', data.classes, metadata.jobs, issues)

  const playable = new Set(metadata.combos)
  const combinations = species.flatMap(({ abbr }) => metadata.jobs.map((job) => abbr + job.abbr))
  const currentCombos = new Set(combinations)
  const expectedUnavailable = new Set(combinations.filter((combo) => !playable.has(combo)))
  const actualUnavailable = new Set(unavailableCombos.filter((combo) => currentCombos.has(combo)))

  for (const combo of [...expectedUnavailable].sort()) {
    if (!actualUnavailable.has(combo)) issues.push(`Missing frontend exclusion: ${combo}`)
  }
  for (const combo of [...actualUnavailable].sort()) {
    if (!expectedUnavailable.has(combo)) issues.push(`Frontend excludes a playable combo: ${combo}`)
  }

  if (issues.length) {
    console.error(`Trunk data is out of date:\n${issues.map((issue) => `  - ${issue}`).join('\n')}`)
    process.exitCode = 1
    return
  }

  logger(
    `Trunk data matches: ${species.length} species, ${metadata.jobs.length} backgrounds, ` +
      `${playable.size} playable combos, ${expectedUnavailable.size} unavailable combos.`,
  )
}

try {
  main()
} catch (error) {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
}
