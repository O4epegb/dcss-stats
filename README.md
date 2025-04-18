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

Start Postgres with Docker Compose:

```sh
yarn workspace @dcss-stats/api compose
```

If you want to run backend with different Postgres database, you can change `DATABASE_URL` env variable in `.env.local` file (create it if it doesn't exist in `apps/api` folder):

```yml
DATABASE_URL='postgresql://postgres:postgres@localhost:5432/dcssstats'
```

Then you can run migrations and seed the database:

```sh
yarn migrate
```

Run only the backend with:

```sh
yarn dev:api
```

## Environment Variables

If you want to change some environment variables only for your local development then you need to make a `.env.local` file. Check other `.env*` files or search for `NEXT_PUBLIC_` to see what variables are being used.
