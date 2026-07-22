# syntax=docker/dockerfile:1.7
FROM node:22-alpine AS build

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable && corepack prepare pnpm@11.7.0 --activate
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/academic-queue/package.json packages/academic-queue/package.json
COPY packages/database/package.json packages/database/package.json
COPY packages/typescript-config/package.json packages/typescript-config/package.json
COPY services/schedule/package.json services/schedule/package.json

RUN --mount=type=cache,id=scilab-pnpm-store,target=/pnpm/store \
    pnpm config set store-dir /pnpm/store && \
    pnpm --filter schedule... install --frozen-lockfile
COPY packages/academic-queue ./packages/academic-queue
COPY packages/database ./packages/database
COPY packages/typescript-config ./packages/typescript-config
COPY services/schedule ./services/schedule
RUN pnpm --filter schedule... -r run build

FROM node:22-alpine AS runtime
WORKDIR /app
COPY --from=build /app /app
WORKDIR /app/services/schedule
CMD ["node", "dist/main.js"]
