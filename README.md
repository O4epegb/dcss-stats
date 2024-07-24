<p align="center">
  <img width="128" height="128" src="./apps/web/public/logo-256.png">
</p>

# [DCSS Stats](https://dcss-stats.vercel.app/)

[Dungeon Crawl Stone Soup](https://crawl.develz.org/) statistics app.

<a href="https://www.buymeacoffee.com/totalnoob" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" style="height: 60px !important;width: 217px !important;" ></a>

### Prerequisites

- [Node.js](https://nodejs.org/)
- [Yarn](https://yarnpkg.com/)
- (for the BE) [Docker Compose](https://docs.docker.com/compose/) or local Postgres database

### Bootstrap local development

```sh
yarn bootstrap
```

It will install all npm dependencies, run Postgres with Docker Compose and create seeded database.

### Run development mode

```sh
yarn dev
```

It will start both frontend and backend in development mode.

### Install packages (if not using `yarn bootstrap`)

This is a `yarn` monorepo, so you need to install packages in the root folder with:

`yarn install`

Use `yarn` to install, other package managers are not recommended.

If you want to update package versions use `yarn upgrade-interactive`

### Frontend

If you only want to run frontend, point `NEXT_PUBLIC_ROOT_URL` env variable to the production backend at `https://dcss-stats.vercel.app`:

```yml
NEXT_PUBLIC_ROOT_URL="https://dcss-stats.vercel.app"
```

Then run frontend with:

```sh
yarn dev --filter=@dcss-stats/web
```

### Backend

Start Postgres with Docker Compose:

```sh
yarn workspace @dcss-stats/api compose
```

Run backend with:

```sh
yarn dev --filter=@dcss-stats/api
```

### Environment variables

If you want to change some environment variables only for your local development then you need to make `.env.local` file. Check other `.env*` files or search for `NEXT_PUBLIC_` to see what variables are being used.
