FROM node:22-alpine AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable
RUN corepack prepare pnpm@9.0.0 --activate

FROM base AS build

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/mobile/package.json apps/mobile/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/eslint-config/package.json packages/eslint-config/package.json
COPY packages/typescript-config/package.json packages/typescript-config/package.json
COPY services/api/package.json services/api/package.json

RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm --filter api build

FROM base AS runtime

WORKDIR /app/services/api

ENV PORT="6011"

COPY --from=build /app/package.json /app/package.json
COPY --from=build /app/pnpm-lock.yaml /app/pnpm-lock.yaml
COPY --from=build /app/pnpm-workspace.yaml /app/pnpm-workspace.yaml
COPY --from=build /app/node_modules /app/node_modules
COPY --from=build /app/services/api/node_modules ./node_modules
COPY --from=build /app/services/api/package.json ./package.json
COPY --from=build /app/services/api/dist ./dist
COPY --from=build /app/services/api/prisma ./prisma

EXPOSE 6011

CMD ["node", "dist/main.js"]
