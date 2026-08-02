import { defineManifest } from '@crxjs/vite-plugin'

const icons = {
  16: 'icons/octopode-16.png',
  24: 'icons/octopode-24.png',
  32: 'icons/octopode-32.png',
  48: 'icons/octopode-48.png',
  128: 'icons/octopode-128.png',
}

export default defineManifest({
  name: 'Dungeon Crawl Stone Soup Webtiles Extension',
  description: 'Shows player stats on the DCSS WebTiles main screen',
  version: '3.0',
  manifest_version: 3,
  icons,
  permissions: ['storage'],
  background: {
    service_worker: 'src/background.ts',
  },
  action: {
    default_icon: icons,
    default_popup: 'popup.html',
  },
  content_scripts: [
    {
      js: ['src/content.ts'],
      matches: [
        'https://crawl.roguelikes.gg/*',
        'https://crawl-br.roguelikes.gg/*',
        'https://crawl.nemelex.cards/*',
        'https://crawl.dcss.io/*',
        'https://crawl.xtahua.com/*',
        'https://underhound.eu/*',
        'https://crawl.develz.org/*',
        'http://crawl.berotato.org/*',
        'https://cbro.berotato.org/*',
        'https://crawl.akrasiac.org/*',
        'http://lazy-life.ddo.jp/*',
        'https://crawl.project357.org/*',
      ],
    },
  ],
})
