ARG NODE_IMAGE=node:22.23.4-alpine

FROM ${NODE_IMAGE}

RUN apk add --no-cache wget

WORKDIR /usr/src/app

COPY .yarn ./.yarn
COPY package.json yarn.lock .yarnrc.yml ./
COPY apps/api/package.json ./apps/api/
COPY apps/extractor/package.json ./apps/extractor/

RUN yarn install

COPY . .
RUN yarn workspace @dcss-stats/api build

CMD [ "yarn", "start:api" ]
