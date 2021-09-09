# DCSS Stats Frontend

### Install required packages

`yarn install`

Use `yarn` to install, not `npm`.

If you want to update packages use `yarn upgrade-interactive` (with `--latest` flag if needed)

### Run development server

`yarn dev`

Server will run on `7331` port by default, you can change it with `-p` flag:

`yarn dev -p 8888`

### Environment variables

If you want to change some environment variables only for your local development then you need to make `.env.local` file. Check other `.env*` files or just search for `NEXT_PUBLIC_` to see what variables are being used.
