# syntax=docker/dockerfile:1.7

FROM node:24.14.0-bookworm-slim AS builder

RUN apt-get update && apt-get install -y --no-install-recommends \
  binutils-gold \
  bison \
  build-essential \
  ca-certificates \
  ccache \
  curl \
  flex \
  fonts-dejavu-core \
  git \
  libfreetype6-dev \
  liblua5.4-dev \
  libncursesw5-dev \
  libpng-dev \
  libsdl2-dev \
  libsdl2-image-dev \
  libsdl2-mixer-dev \
  libsqlite3-dev \
  pkg-config \
  python-is-python3 \
  python3-yaml \
  zlib1g-dev \
  && rm -rf /var/lib/apt/lists/*

ENV PATH="/usr/lib/ccache:${PATH}"
ENV CCACHE_DIR=/root/.cache/ccache
ENV CCACHE_COMPRESS=1
ENV CCACHE_MAXSIZE=2G

WORKDIR /usr/src/app

COPY .yarn ./.yarn
COPY package.json yarn.lock .yarnrc.yml ./
COPY apps/extractor/package.json ./apps/extractor/

RUN yarn install

COPY apps/extractor/tsconfig.json ./apps/extractor/
COPY apps/extractor/src/utils.ts ./apps/extractor/src/utils.ts
COPY apps/extractor/scripts/install-crawl.ts ./apps/extractor/scripts/install-crawl.ts

WORKDIR /usr/src/app/apps/extractor

RUN yarn install-crawl

COPY apps/extractor/scripts/apply-crawl-customizations.ts ./scripts/apply-crawl-customizations.ts
COPY apps/extractor/scripts/build-crawl.ts ./scripts/build-crawl.ts
COPY apps/extractor/crawl-customizations/util/monster/monster-export-main.cc ./crawl-customizations/util/monster/monster-export-main.cc

RUN yarn apply-crawl-customizations
RUN --mount=type=cache,target=/root/.cache/ccache yarn build-crawl

COPY apps/extractor/src/monsterCatalog.ts ./src/monsterCatalog.ts
COPY apps/extractor/scripts/extract-monsters.ts ./scripts/extract-monsters.ts

RUN yarn extract-monsters

FROM busybox:1.36 AS runtime

COPY --from=builder /usr/src/app/apps/extractor/.cache/monsters.json /catalog/monsters.json

CMD ["sh", "-lc", "echo 'Monster catalog published to /catalog/monsters.json'"]
