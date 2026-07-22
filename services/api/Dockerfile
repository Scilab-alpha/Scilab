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

FROM node:22-alpine AS runtime

ENV PORT="6003"
ENV SCIMAGO_DATASET_DIR="/app/docs/scimagojr/normalized"
WORKDIR /app

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/packages/academic ./packages/academic
COPY --from=build /app/packages/academic-queue ./packages/academic-queue
COPY --from=build /app/packages/database ./packages/database
COPY --from=build /app/packages/neo4j ./packages/neo4j
COPY --from=build /app/services/api ./services/api
COPY --from=build /app/docs/scimagojr/normalized ./docs/scimagojr/normalized
WORKDIR /app/services/api
EXPOSE 6003
CMD ["node", "dist/main.js"]
