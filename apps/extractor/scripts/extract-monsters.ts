/* eslint-disable no-console */
import { buildMonsterCatalog, getMonsterCatalogPath } from '~/monsterCatalog'

async function main() {
  try {
    const catalog = await buildMonsterCatalog()

    console.log(`\n✅ Monster data saved to ${getMonsterCatalogPath()}`)
    console.log(
      `Processed ${catalog.processedCount} out of ${catalog.listedCount} monsters successfully.`,
    )

    if (catalog.failedCount > 0) {
      console.warn(`Encountered ${catalog.failedCount} extraction failures.`)
    }
  } catch (error) {
    console.error('❌ Error processing monsters:', error)
    process.exit(1)
  }
}

void main()
