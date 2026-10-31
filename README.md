<p align="center">
  <img width="128" height="128" src="./apps/web/public/logo-256.png">
</p>

# [DCSS Stats](https://dcss-stats.com/)

[Dungeon Crawl Stone Soup](https://crawl.develz.org/) statistics app.

<a href="https://www.buymeacoffee.com/totalnoob" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" style="height: 60px !important;width: 217px !important;" ></a>

## Prerequisites

- [Node.js](https://nodejs.org/)
- [Yarn](https://yarnpkg.com/)
- (for the BE) [Docker Compose](https://docs.docker.com/compose/) or local Postgres database

## Bootstrap Local Development

```sh
yarn install && yarn bootstrap
```

It will install all npm dependencies, run Postgres with Docker Compose and create seeded database.

## Run Development Mode

```sh
yarn dev
```

It will start both frontend and backend in development mode.

## Install Packages and Update Versions

This is a `yarn` monorepo, so you need to install packages in the root folder with:

```sh
yarn install
```

Use `yarn` to install, other package managers are not recommended.

If you want to update package versions use:

```sh
yarn upgrade-interactive
```

## Frontend

If you only want to run frontend, create `.env.local` file in `apps/web` folder if it doesn't exist and add:

```yml
NEXT_PUBLIC_ROOT_URL="https://dcss-stats.com"
```

Then run frontend with:

```sh
yarn dev:web
```

## Backend

Postgres uses port `5432` by default. To change it for the API, Compose, and Prisma, add this to `apps/api/.env.local`:

```dotenv
POSTGRES_PORT=15432
```

Remove any existing `DATABASE_URL` override to use this port. To connect to another database, set `DATABASE_URL` instead.

Start Postgres with Docker Compose (rerun after changing the port, then restart the API):

```sh
yarn workspace @dcss-stats/api compose up -d
```

Then you can run migrations and seed the database:

```sh
yarn migrate
```

Run only the backend with:

```sh
yarn dev:api
```

Run other Prisma commands with:

```sh
yarn workspace @dcss-stats/api prisma <command>
```

## Browser Extension

Run the Vite development build for the browser extension with:

```sh
yarn dev:extension
```

Then load `apps/extension/dist` as an unpacked extension in Chrome. See the [extension README](./apps/extension/README.md) for production build and packaging commands.

## Environment Variables

If you want to change some environment variables only for your local development then you need to make a `.env.local` file. Check other `.env*` files or search for `NEXT_PUBLIC_` to see what variables are being used.
