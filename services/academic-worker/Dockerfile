FROM node:22-alpine AS build

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable && corepack prepare pnpm@11.7.0 --activate
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/mobile/package.json apps/mobile/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/academic/package.json packages/academic/package.json
COPY packages/academic-queue/package.json packages/academic-queue/package.json
COPY packages/database/package.json packages/database/package.json
COPY packages/neo4j/package.json packages/neo4j/package.json
COPY packages/eslint-config/package.json packages/eslint-config/package.json
COPY packages/typescript-config/package.json packages/typescript-config/package.json
COPY services/api/package.json services/api/package.json
COPY services/schedule/package.json services/schedule/package.json
COPY services/academic-worker/package.json services/academic-worker/package.json

RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm --filter @repo/database prisma:generate && pnpm turbo run build --filter=academic-worker...
# Reuse packages already installed in this stage. Explicit hard links avoid
# copying the pnpm store into /runtime, which exceeds Coolify's build timeout.
RUN pnpm --offline --package-import-method=hardlink \
    --config.inject-workspace-packages=true \
    --filter academic-worker --prod deploy /runtime
# pnpm deploy omits Prisma's generated client because it is created after
# installation. Preserve that generated output for every runtime client copy.
RUN prisma_client="$(find /app/node_modules/.pnpm -path '*/node_modules/.prisma/client' -type d -print -quit)" && \
    test -n "$prisma_client" && \
    for client_package in $(find /runtime/node_modules/.pnpm -path '*/node_modules/@prisma/client' -type d); do \
      prisma_output="$(dirname "$(dirname "$client_package")")/.prisma"; \
      mkdir -p "$prisma_output"; \
      cp -R "$prisma_client" "$prisma_output/client"; \
    done
RUN mkdir -p /runtime/docs/scimagojr && \
    cp -R docs/scimagojr/normalized /runtime/docs/scimagojr/normalized

FROM node:22-alpine AS runtime

ENV NODE_ENV="production"
ENV SCIMAGO_DATASET_DIR="/app/docs/scimagojr/normalized"

WORKDIR /app
COPY --from=build /runtime /app
CMD ["node", "dist/main.js"]
