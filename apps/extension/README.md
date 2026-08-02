# DCSS Stats browser extension

[Chrome Web Store listing](https://chrome.google.com/webstore/detail/dungeon-crawl-stone-soup/ihjfplpgkimacgadjjdafpnekibmhjfd)

The extension shows player stats on the main screen of [Dungeon Crawl Stone Soup](https://crawl.develz.org/) WebTiles servers.

## Development

Install dependencies from the repository root:

```sh
yarn install
```

Start the Vite development build:

```sh
yarn dev:extension
```

Then load `apps/extension/dist` as an unpacked extension in Chrome. Vite and CRXJS keep that directory updated while the development server runs.

The production API and website URLs are used by default. To override them, copy `.env.example` to `.env.local` and change `VITE_API_URL` and `VITE_WEB_URL`.

## Build and package

Create a production build:

```sh
yarn workspace @dcss-stats/extension build
```

Create `apps/extension/extension.zip` for distribution:

```sh
yarn workspace @dcss-stats/extension package
```
