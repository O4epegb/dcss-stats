import { range } from 'lodash-es'

const trunkGameVersion = 33

export const data = {
  races: [
    ['Ko', 'Kobold'],
    ['VS', 'Vine Stalker'],
    ['Mi', 'Minotaur'],
    ['Sp', 'Spriggan'],
    ['Tr', 'Troll'],
    ['Dg', 'Demigod'],
    ['Dj', 'Djinni'],
    ['Ds', 'Demonspawn'],
    ['DE', 'Deep Elf'],
    ['Hu', 'Human'],
    ['Dr', 'Draconian'],
    ['Gr', 'Gargoyle'],
    ['Fo', 'Formicid'],
    ['Te', 'Tengu'],
    ['Fe', 'Felid'],
    ['MD', 'Mountain Dwarf'],
    ['Mf', 'Merfolk'],
    ['Mu', 'Mummy'],
    ['Na', 'Naga'],
    ['Op', 'Octopode'],
    ['On', 'Oni'],
    ['Ba', 'Barachi'],
    ['Gn', 'Gnoll'],
    ['At', 'Armataur'],
    ['Co', 'Coglin'],
    ['Re', 'Revenant'],
    ['Po', 'Poltergeist'],
    ['Gh', 'Ghoul', false],
    ['Vp', 'Vampire', false],
    ['HO', 'Hill Orc', false],
    ['Og', 'Ogre', false],
    ['Me', 'Meteoran', false],
    ['Pa', 'Palentonga', false],
    ['My', 'Mayflytaur', false],
    ['DD', 'Deep Dwarf', false],
    ['HE', 'High Elf', false],
    ['Ce', 'Centaur', false],
    ['Ha', 'Halfling', false],
    ['SE', 'Sludge Elf', false],
    ['OM', 'Ogre-Mage', false],
    ['LO', 'Lava Orc', false],
    ['Bu', 'Bultungin', false],
    ['GE', 'Grey Elf', false],
    ['HD', 'Hill Dwarf', false],
    ['El', 'Elf', false],
    ['Gm', 'Gnome', false],
  ],
  classes: [
    ['Al', 'Alchemist'],
    ['Ar', 'Artificer'],
    ['Fi', 'Fighter'],
    ['HW', 'Hedge Wizard'],
    ['FE', 'Fire Elementalist'],
    ['En', 'Enchanter'],
    ['Gl', 'Gladiator'],
    ['CK', 'Chaos Knight'],
    ['AE', 'Air Elementalist'],
    ['Be', 'Berserker'],
    ['Mo', 'Monk'],
    ['IE', 'Ice Elementalist'],
    ['Sh', 'Shapeshifter'],
    ['Wn', 'Wanderer'],
    ['Hu', 'Hunter'],
    ['Hs', 'Hexslinger'],
    ['EE', 'Earth Elementalist'],
    ['Cj', 'Conjurer'],
    ['Wr', 'Warper'],
    ['Ne', 'Necromancer'],
    ['Su', 'Summoner'],
    ['De', 'Delver'],
    ['Br', 'Brigand'],
    ['CA', 'Cinder Acolyte'],
    ['Re', 'Reaver'],
    ['Fw', 'Forgewright'],
    ['Tm', 'Transmuter', false],
    ['He', 'Healer', false],
    ['Sk', 'Skald', false],
    ['DK', 'Death Knight', false],
    ['St', 'Stalker', false],
    ['Pr', 'Priest', false],
    ['Cr', 'Crusader', false],
    ['Pa', 'Paladin', false],
    ['Th', 'Thief', false],
    ['Jr', 'Jester', false],
    ['AK', 'Abyssal Knight', false],
    ['VM', 'Venom Mage', false],
  ],
  gods: [
    'Ashenzari',
    'Beogh',
    'Cheibriados',
    'Dithmenos',
    'Elyvilon',
    'Fedhas',
    'Gozag',
    'Hepliaklqana',
    'Wu Jian',
    'Ignis',
    'Jiyva',
    'Kikubaaqudgha',
    'Lugonu',
    'Makhleb',
    'Nemelex Xobeh',
    'Okawaru',
    'Qazlal',
    'Ru',
    'Sif Muna',
    'the Shining One',
    'Trog',
    'Uskayaw',
    'Vehumet',
    'Xom',
    'Yredelemnul',
    'Zin',
  ],
  bots: [
    'autorobin',
    'xw',
    'auto7hm',
    'rw',
    'qw',
    'ow',
    'qwrobin',
    'gw',
    'notqw',
    'jw',
    'parabodrick',
    'hyperqwbe',
    'cashybrid',
    'tstbtto',
    'parabolic',
    'oppbolic',
    'ew',
    'rushxxi',
    'gaubot',
    'cojitobot',
    'paulcdejean',
    'otabotab',
    'nakatomy',
    'testingqw',
    'beemell',
    'beem',
    'drasked',
    'phybot',
    'medicine',
    'dracbot',
    'whoyougonnacall',
    'khrogbot',
    'jwbot',
    'lovelain',
    'autocrawlbot',
    'swippen',
    'cotteux',
    'someone4956',
    'nofunallowed',
    'cosagabot',
    'cloudy120',
    'patr1k',
    'chaobot',
    'esqueletobot',
    'laya',
    'kgb0614',
    'fastman',
    'idfk',
    'a3bot',
    'gbos',
  ],
  servers: [
    {
      name: 'Nemelex',
      abbreviation: 'CNC',
      url: 'https://crawl.nemelex.cards',
      baseUrl: 'https://archive.nemelex.cards',
      morgueUrl: 'https://archive.nemelex.cards/morgue',
      logfiles: [
        ...range(11, trunkGameVersion).map((version) => ({
          path: `/meta/crawl-0.${version}/logfile`,
          version: `0.${version}`,
          morgueUrlPrefix: undefined,
        })),
        {
          path: `/meta/crawl-git/logfile`,
          version: 'git',
          morgueUrlPrefix: undefined,
        },
      ],
    },
    {
      name: 'crawl.dcss.io',
      abbreviation: 'CDI',
      url: 'https://crawl.dcss.io',
      baseUrl: 'https://crawl.dcss.io',
      morgueUrl: 'https://crawl.dcss.io/crawl/morgue',
      logfiles: [
        ...range(30, trunkGameVersion).map((version) => ({
          path: `/crawl/meta/crawl-0.${version}/logfile`,
          version: `0.${version}`,
          morgueUrlPrefix: undefined,
        })),
        {
          path: `/crawl/meta/crawl-git/logfile`,
          version: 'git',
          morgueUrlPrefix: undefined,
        },
      ],
    },
    {
      name: 'Xtahua',
      abbreviation: 'CXC',
      url: 'https://crawl.xtahua.com',
      baseUrl: 'https://crawl.xtahua.com',
      morgueUrl: 'https://crawl.xtahua.com/crawl/morgue',
      logfiles: [
        ...range(14, trunkGameVersion).map((version) => ({
          path: `/crawl/meta/0.${version}/logfile`,
          version: `0.${version}`,
          morgueUrlPrefix: undefined,
        })),
        {
          path: `/crawl/meta/git/logfile`,
          version: 'git',
          morgueUrlPrefix: undefined,
        },
      ],
    },
    {
      name: 'Underhound',
      abbreviation: 'CUE',
      url: 'https://underhound.eu:8080',
      baseUrl: 'https://underhound.eu',
      morgueUrl: 'https://underhound.eu/crawl/morgue',
      logfiles: [
        ...range(10, trunkGameVersion).map((version) => ({
          path: `/crawl/meta/0.${version}/logfile`,
          version: `0.${version}`,
          morgueUrlPrefix: undefined,
        })),
        {
          path: `/crawl/meta/git/logfile`,
          version: 'git',
          morgueUrlPrefix: undefined,
        },
      ],
    },
    {
      name: 'Kelbi',
      abbreviation: 'CKO',
      url: 'https://crawl.kelbi.org',
      baseUrl: 'https://crawl.kelbi.org',
      morgueUrl: 'https://crawl.kelbi.org/crawl/morgue',
      isDormant: true,
      logfiles: [
        {
          path: `/crawl/meta/0.18/logfile`,
          version: '0.18',
          morgueUrlPrefix: undefined,
        },
        ...range(21, 32).map((version) => ({
          path: `/crawl/meta/0.${version}/logfile`,
          version: `0.${version}`,
          morgueUrlPrefix: undefined,
        })),
        {
          path: `/crawl/meta/git/logfile`,
          version: 'git',
          morgueUrlPrefix: undefined,
        },
      ],
    },
    {
      name: 'Develz',
      abbreviation: 'CDO',
      url: 'https://crawl.develz.org',
      baseUrl: 'https://crawl.develz.org',
      morgueUrl: 'https://crawl.develz.org/morgues',
      logfiles: [
        ...range(4, 9).map((version) => ({
          path: `/allgames-0.${version}`,
          version: `0.${version}`,
          morgueUrlPrefix: undefined,
        })),
        ...range(10, 27).map((version) => ({
          path: `/allgames-0.${version}`,
          version: `0.${version}`,
          morgueUrlPrefix: `/0.${version}`,
        })),
        {
          path: `/allgames-svn.txt`,
          version: 'git',
          morgueUrlPrefix: '/trunk',
        },
      ],
    },
    {
      name: 'BeRotato',
      abbreviation: 'CBRO',
      url: 'http://crawl.berotato.org:8080',
      baseUrl: 'http://crawl.berotato.org',
      morgueUrl: 'http://crawl.berotato.org/crawl/morgue',
      logfiles: [
        ...range(13, 26).map((version) => ({
          path: `/crawl/meta/0.${version}/logfile`,
          version: `0.${version}`,
          morgueUrlPrefix: undefined,
        })),
        {
          path: `/crawl/meta/git/logfile`,
          version: 'git',
          morgueUrlPrefix: undefined,
        },
      ],
    },
    {
      name: 'BeRotato-2',
      abbreviation: 'CBR2',
      url: 'https://cbro.berotato.org',
      baseUrl: 'https://cbro.berotato.org',
      morgueUrl: 'https://cbro.berotato.org/morgue',
      logfiles: [
        ...range(24, trunkGameVersion).map((version) => ({
          path: `/meta/0.${version}/logfile`,
          version: `0.${version}`,
          morgueUrlPrefix: undefined,
        })),
        {
          path: `/meta/git/logfile`,
          version: 'git',
          morgueUrlPrefix: undefined,
        },
      ],
    },
    {
      name: 'Webzook',
      abbreviation: 'CWZ',
      url: 'http://webzook.net:8080',
      baseUrl: 'https://webzook.net',
      morgueUrl: 'http://webzook.net/soup/morgue',
      isDormant: true,
      logfiles: [
        ...range(13, 32).map((version) => ({
          path: `/soup/0.${version}/logfile`,
          version: `0.${version}`,
          morgueUrlPrefix: `/0.${version}`,
        })),
        {
          path: `/soup/trunk/logfile`,
          version: 'git',
          morgueUrlPrefix: '/trunk',
        },
      ],
    },
    {
      name: 'Akrasiac',
      abbreviation: 'CAO',
      url: 'http://crawl.akrasiac.org',
      baseUrl: 'http://crawl.akrasiac.org',
      morgueUrl: 'http://crawl.akrasiac.org/rawdata',
      logfiles: [
        ...range(4, trunkGameVersion).map((version) => ({
          path: `/logfile${version.toString().padStart(2, '0')}`,
          version: `0.${version}`,
          morgueUrlPrefix: undefined,
        })),
        {
          path: `/logfile-git`,
          version: 'git',
          morgueUrlPrefix: undefined,
        },
        {
          path: `/allgames.txt`,
          version: 'git-old',
          morgueUrlPrefix: undefined,
        },
      ],
    },
    {
      name: 'Lazy Life',
      abbreviation: 'LLD',
      url: 'http://lazy-life.ddo.jp:8080',
      baseUrl: 'http://lazy-life.ddo.jp/mirror',
      morgueUrl: 'http://lazy-life.ddo.jp:8080/morgue',
      logfiles: [
        ...range(14, trunkGameVersion).map((version) => ({
          path: `/meta/0.${version}/logfile`,
          version: `0.${version}`,
          morgueUrlPrefix: undefined,
        })),
        {
          path: `/meta/trunk/logfile`,
          version: 'git',
          morgueUrlPrefix: undefined,
        },
      ],
    },
    {
      name: 'Project357',
      abbreviation: 'CPO',
      url: 'https://crawl.project357.org',
      baseUrl: 'https://crawl.project357.org',
      morgueUrl: 'https://crawl.project357.org/morgue',
      logfiles: [
        ...range(15, trunkGameVersion).map((version) => ({
          path: `/dcss-logfiles-0.${version}`,
          version: `0.${version}`,
          morgueUrlPrefix: undefined,
        })),
        {
          path: `/dcss-logfiles-trunk`,
          version: 'git',
          morgueUrlPrefix: undefined,
        },
      ],
    },
    {
      name: 'Dobrazupa',
      abbreviation: 'CSZO',
      url: 'http://s-z.org',
      baseUrl: 'https://loom.shalott.org',
      morgueUrl: 'https://f000.backblazeb2.com/file/dcss-archives/www.dobrazupa.org/morgue',
      logfiles: [
        ...range(10, 18).map((version) => ({
          path: `/server-xlogs/cszo/meta/0.${version}/logfile`,
          version: `0.${version}`,
          morgueUrlPrefix: undefined,
        })),
        {
          path: `/server-xlogs/cszo/meta/git/logfile`,
          version: 'git',
          morgueUrlPrefix: undefined,
        },
      ],
    },
    {
      name: 'RHF',
      abbreviation: 'RHF',
      url: 'http://rl.heh.fi',
      baseUrl: 'https://loom.shalott.org',
      morgueUrl: 'http://rl.heh.fi/morgue',
      logfiles: [
        ...[5, 6, 7, 12].map((version) => ({
          path: `/server-xlogs/remote.rhf-logfile-0.${version}`,
          version: `0.${version}`,
          morgueUrlPrefix: undefined,
        })),
        {
          path: `/server-xlogs/remote.rhf-logfile-git`,
          version: 'git',
          morgueUrlPrefix: undefined,
        },
        {
          path: `/server-xlogs/remote.rhf-logfile-git-rhfnewgit`,
          version: 'git-new',
          morgueUrlPrefix: undefined,
        },
      ],
    },
    {
      name: 'Jorgrun',
      abbreviation: 'CJR',
      url: 'https://crawl.jorgrun.rocks',
      baseUrl: 'https://loom.shalott.org',
      morgueUrl: 'https://s3-us-west-2.amazonaws.com/crawl.jorgrun.rocks/morgue',
      logfiles: [
        ...range(17, 23).map((version) => ({
          path: `/server-xlogs/cjr/meta/0.${version}/logfile`,
          version: `0.${version}`,
          morgueUrlPrefix: undefined,
        })),
        {
          path: `/server-xlogs/cjr/meta/git/logfile`,
          version: 'git',
          morgueUrlPrefix: undefined,
        },
      ],
    },
  ],
} as const
