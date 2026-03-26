import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs-extra'
import { logger } from '~/utils'

const CRAWL_DIR = path.resolve(process.cwd(), 'crawl')
const CRAWL_SOURCE_DIR = path.resolve(CRAWL_DIR, 'crawl-ref', 'source')
const CUSTOMIZATIONS_DIR = path.resolve(process.cwd(), 'crawl-customizations')
const CUSTOM_MONSTER_EXPORT_SOURCE = path.join(
  CUSTOMIZATIONS_DIR,
  'util/monster/monster-export-main.cc',
)
const CRAWL_MONSTER_EXPORT_SOURCE = path.join(
  CRAWL_SOURCE_DIR,
  'util/monster/monster-export-main.cc',
)
const CRAWL_MAKEFILE = path.join(CRAWL_SOURCE_DIR, 'Makefile')
const MONSTER_EXPORT_COMPILE_RULE =
  'util/monster/monster-export-main.o: util/monster/monster-export-main.cc util/monster/vault_monster_data.h | $(GENERATED_HEADERS) $(TILEDEFHDRS)\n' +
  'ifdef NO_INLINE_DEPGEN\n' +
  '\t$(QUIET_DEPEND)$(or $(DEPCXX),$(CXX)) -MM $(STDFLAG) $(ALL_CFLAGS) -MT $@ $< > $(@:%.o=%.d)\n' +
  'endif\n' +
  '\t$(QUIET_CXX)$(CXX) $(STDFLAG) $(ALL_CFLAGS) $(INLINE_DEPGEN_CFLAGS) -c $< -o $@\n' +
  'ifndef NO_INLINE_DEPGEN\n' +
  '\t@if [ -f $(@:%.o=%.d) ]; then touch -r $@ $(@:%.o=%.d); fi\n' +
  'endif\n'

const CJSON_SOURCE_DIR = path.join(CUSTOMIZATIONS_DIR, 'contrib', 'cjson')
const CJSON_DEST_DIR = path.join(CRAWL_SOURCE_DIR, 'contrib', 'cjson')

export function applyCrawlCustomizations() {
  if (!fs.existsSync(CRAWL_SOURCE_DIR)) {
    throw new Error(`Crawl source directory not found at ${CRAWL_SOURCE_DIR}.`)
  }

  if (!fs.existsSync(CUSTOM_MONSTER_EXPORT_SOURCE)) {
    throw new Error(`Custom monster exporter source not found at ${CUSTOM_MONSTER_EXPORT_SOURCE}.`)
  }

  if (!fs.existsSync(CJSON_SOURCE_DIR)) {
    throw new Error(`cJSON source not found at ${CJSON_SOURCE_DIR}.`)
  }

  fs.copyFileSync(CUSTOM_MONSTER_EXPORT_SOURCE, CRAWL_MONSTER_EXPORT_SOURCE)
  logger(`Copied custom exporter source to ${CRAWL_MONSTER_EXPORT_SOURCE}`)

  fs.ensureDirSync(CJSON_DEST_DIR)
  fs.copyFileSync(path.join(CJSON_SOURCE_DIR, 'cJSON.c'), path.join(CJSON_DEST_DIR, 'cJSON.c'))
  fs.copyFileSync(path.join(CJSON_SOURCE_DIR, 'cJSON.h'), path.join(CJSON_DEST_DIR, 'cJSON.h'))
  logger(`Copied cJSON to ${CJSON_DEST_DIR}`)

  patchMakefile()
}

const CJSON_COMPILE_RULE =
  'contrib/cjson/cJSON.o: contrib/cjson/cJSON.c contrib/cjson/cJSON.h\n' +
  '\t$(QUIET_CXX)$(CC) -c $< -o $@\n'

function patchMakefile() {
  const makefile = fs.readFileSync(CRAWL_MAKEFILE, 'utf-8')
  let updatedMakefile = normalizeMonsterExportCompileRule(makefile)

  // Remove old cJSON rules if present (to allow re-patching with updated rules)
  updatedMakefile = updatedMakefile.replaceAll(CJSON_COMPILE_RULE, '')
  updatedMakefile = updatedMakefile.replace(
    'MONSTER_EXPORT_OBJS=$(OBJECTS) util/monster/monster-export-main.o contrib/cjson/cJSON.o $(EXTRA_OBJECTS)\n',
    'MONSTER_EXPORT_OBJS=$(OBJECTS) util/monster/monster-export-main.o $(EXTRA_OBJECTS)\n',
  )

  if (
    !updatedMakefile.includes(
      'MONSTER_EXPORT_OBJS=$(OBJECTS) util/monster/monster-export-main.o $(EXTRA_OBJECTS)',
    )
  ) {
    updatedMakefile = replaceExactlyOnce(
      updatedMakefile,
      'GAME_OBJS=$(OBJECTS) main.o $(EXTRA_OBJECTS)\nMONSTER_OBJS=$(OBJECTS) util/monster/monster-main.o $(EXTRA_OBJECTS)\nCATCH2_TEST_OBJECTS = $(OBJECTS) $(TEST_OBJECTS) catch2-tests/catch_amalgamated.o catch2-tests/test_main.o $(EXTRA_OBJECTS)\n',
      'GAME_OBJS=$(OBJECTS) main.o $(EXTRA_OBJECTS)\nMONSTER_OBJS=$(OBJECTS) util/monster/monster-main.o $(EXTRA_OBJECTS)\nMONSTER_EXPORT_OBJS=$(OBJECTS) util/monster/monster-export-main.o $(EXTRA_OBJECTS)\nCATCH2_TEST_OBJECTS = $(OBJECTS) $(TEST_OBJECTS) catch2-tests/catch_amalgamated.o catch2-tests/test_main.o $(EXTRA_OBJECTS)\n',
      'monster export object definition',
    )
  }

  // Add cJSON.o to MONSTER_EXPORT_OBJS
  if (!updatedMakefile.includes('contrib/cjson/cJSON.o')) {
    updatedMakefile = replaceExactlyOnce(
      updatedMakefile,
      'MONSTER_EXPORT_OBJS=$(OBJECTS) util/monster/monster-export-main.o $(EXTRA_OBJECTS)\n',
      'MONSTER_EXPORT_OBJS=$(OBJECTS) util/monster/monster-export-main.o contrib/cjson/cJSON.o $(EXTRA_OBJECTS)\n',
      'cJSON object in MONSTER_EXPORT_OBJS',
    )
  }

  if (!updatedMakefile.includes(MONSTER_EXPORT_COMPILE_RULE)) {
    updatedMakefile = replaceExactlyOnce(
      updatedMakefile,
      'util/monster/monster-main.o: util/monster/vault_monster_data.h\n',
      `util/monster/monster-main.o: util/monster/vault_monster_data.h\n${MONSTER_EXPORT_COMPILE_RULE}`,
      'monster export header dependency',
    )
  }

  // Add cJSON compile rule
  if (!updatedMakefile.includes(CJSON_COMPILE_RULE)) {
    updatedMakefile = replaceExactlyOnce(
      updatedMakefile,
      `${MONSTER_EXPORT_COMPILE_RULE}`,
      `${MONSTER_EXPORT_COMPILE_RULE}${CJSON_COMPILE_RULE}`,
      'cJSON compile rule',
    )
  }

  if (
    !updatedMakefile.includes(
      'util/monster/monster-export: $(MONSTER_EXPORT_OBJS) $(CONTRIB_LIBS) dat/dlua/tags.lua',
    )
  ) {
    updatedMakefile = replaceExactlyOnce(
      updatedMakefile,
      'util/monster/monster: $(MONSTER_OBJS) $(CONTRIB_LIBS) dat/dlua/tags.lua\n\t+$(QUIET_LINK)$(CXX) $(LDFLAGS) $(MONSTER_OBJS) -o $@ $(LIBS)\n\nmonster: util/monster/monster\n\ntest-monster: monster\n\tutil/monster/monster azure jelly\n\nclean-monster:\n\t$(RM) util/monster/monster util/monster/vault_monster_data.h tile_info.txt\n\ninstall-monster: monster\n\tutil/gather_mons -t > tile_info.txt\n',
      'util/monster/monster: $(MONSTER_OBJS) $(CONTRIB_LIBS) dat/dlua/tags.lua\n\t+$(QUIET_LINK)$(CXX) $(LDFLAGS) $(MONSTER_OBJS) -o $@ $(LIBS)\n\nutil/monster/monster-export: $(MONSTER_EXPORT_OBJS) $(CONTRIB_LIBS) dat/dlua/tags.lua\n\t+$(QUIET_LINK)$(CXX) $(LDFLAGS) $(MONSTER_EXPORT_OBJS) -o $@ $(LIBS)\n\nmonster: util/monster/monster\n\nmonster-export: util/monster/monster-export\n\ntest-monster: monster\n\tutil/monster/monster azure jelly\n\nclean-monster:\n\t$(RM) util/monster/monster util/monster/monster-export util/monster/vault_monster_data.h tile_info.txt\n\ninstall-monster: monster\n\tutil/gather_mons -t > tile_info.txt\n',
      'monster export targets',
    )
  }

  if (updatedMakefile !== makefile) {
    fs.writeFileSync(CRAWL_MAKEFILE, updatedMakefile, 'utf-8')
    logger(`Applied custom Makefile wiring to ${CRAWL_MAKEFILE}`)
  } else {
    logger('Crawl Makefile already contains monster export wiring.')
  }
}

function normalizeMonsterExportCompileRule(source: string) {
  // Remove old cJSON rules (both the old format with STDFLAG and current format)
  source = source.replaceAll(CJSON_COMPILE_RULE, '')
  source = source.replaceAll(
    'contrib/cjson/cJSON.o: contrib/cjson/cJSON.c contrib/cjson/cJSON.h\n' +
      '\t$(QUIET_CXX)$(CC) $(STDFLAG) -c $< -o $@\n',
    '',
  )
  source = source
    .replace('util/monster/monster-export-main.o: util/monster/vault_monster_data.h\n', '')
    .replaceAll(MONSTER_EXPORT_COMPILE_RULE, '')
  return source
}

function replaceExactlyOnce(source: string, search: string, replacement: string, label: string) {
  const firstIndex = source.indexOf(search)

  if (firstIndex === -1) {
    throw new Error(`Failed to apply Crawl customization for ${label}: target snippet not found.`)
  }

  const secondIndex = source.indexOf(search, firstIndex + search.length)

  if (secondIndex !== -1) {
    throw new Error(
      `Failed to apply Crawl customization for ${label}: target snippet was not unique.`,
    )
  }

  return source.replace(search, replacement)
}

async function main() {
  try {
    applyCrawlCustomizations()
    logger('✅ Crawl customizations applied successfully!')
  } catch (error) {
    console.error('❌ Error applying Crawl customizations:', error)
    process.exit(1)
  }
}

const currentFilePath = fileURLToPath(import.meta.url)

if (process.argv[1] && path.resolve(process.argv[1]) === currentFilePath) {
  void main()
}
