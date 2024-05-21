<p align="center">
  <img width="128" height="128" src="./apps/web/public/logo-256.png">
</p>

# [DCSS Stats](https://dcss-stats.vercel.app/)

<a href="https://www.buymeacoffee.com/totalnoob" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" style="height: 60px !important;width: 217px !important;" ></a>

### Install required packages

This is a monorepo, so you need to install packages in the root folder with `yarn`:

`yarn install`

Use `yarn` to install, other package managers will probably not work.

If you want to update packages use `yarn upgrade-interactive`

### Run development mode

`yarn dev`

Frontend server runs on `7331` port by default, you can change it with `-p` flag:

`yarn dev -- -p 8888`

Note that `--` is used to pass arguments (because of https://turbo.build/)

### Environment variables

If you want to change some environment variables only for your local development then you need to make `.env.local` file. Check other `.env*` files or just search for `NEXT_PUBLIC_` to see what variables are being used.
