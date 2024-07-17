ARG NODE_IMAGE=node:22-alpine3.19

FROM ${NODE_IMAGE}

RUN apk add --no-cache wget

WORKDIR /usr/src/app

COPY .yarn ./.yarn
COPY package.json yarn.lock .yarnrc.yml ./
COPY apps/api/package.json ./apps/api/

RUN yarn install

COPY . .
RUN yarn workspace @dcss-stats/api build

CMD [ "yarn", "start:api" ]
