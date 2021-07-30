FROM node:14-alpine AS builder

WORKDIR /app

ARG NEXT_PUBLIC_APP_ENV
ENV NEXT_PUBLIC_APP_ENV=$NEXT_PUBLIC_APP_ENV

RUN test -n "$NEXT_PUBLIC_APP_ENV" || (echo "NEXT_PUBLIC_APP_ENV is not set" && false)

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

COPY . .
RUN yarn build

RUN rm -rf node_modules && yarn install --production --frozen-lockfile


FROM node:14-alpine

WORKDIR /app

COPY package.json next.config.js .env* ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules

CMD yarn start -p 3000 -H 0.0.0.0
