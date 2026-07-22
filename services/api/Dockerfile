FROM node:22-alpine AS build

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable && corepack prepare pnpm@11.7.0 --activate
WORKDIR /app

# Install only the API workspace and its backend dependency closure. This keeps
# mobile and web dependencies out of the API build and its runtime image.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/academic/package.json packages/academic/package.json
COPY packages/academic-queue/package.json packages/academic-queue/package.json
COPY packages/database/package.json packages/database/package.json
COPY packages/neo4j/package.json packages/neo4j/package.json
COPY services/api/package.json services/api/package.json
RUN pnpm --filter api... install --frozen-lockfile

COPY . .
RUN pnpm --filter @repo/database prisma:generate && \
    pnpm --filter api... -r run build

# Deploy from the already-populated pnpm store without network transfers or
# copying packages. The generated Prisma client is added below for runtime use.
RUN pnpm --offline --package-import-method=hardlink \
    --config.inject-workspace-packages=true \
    --filter api --prod deploy /runtime
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

ENV PORT="6003"
ENV SCIMAGO_DATASET_DIR="/app/docs/scimagojr/normalized"
WORKDIR /app

COPY --from=build /runtime /app
EXPOSE 6003
CMD ["node", "dist/main.js"]
