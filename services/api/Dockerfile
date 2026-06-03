# syntax=docker/dockerfile:1

FROM node:20-slim AS deps
RUN corepack enable && apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY pnpm-lock.yaml package.json pnpm-workspace.yaml turbo.json ./
COPY packages/shared/package.json ./packages/shared/
COPY services/api/package.json ./services/api/
RUN pnpm install --frozen-lockfile

FROM node:20-slim AS build
RUN corepack enable && apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=deps /app /app
COPY packages/shared ./packages/shared
COPY services/api ./services/api
RUN pnpm --filter @foyer/shared build \
 && cd services/api \
 && pnpm exec prisma generate \
 && pnpm build

FROM node:20-slim AS runner
RUN corepack enable && apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app/services/api
ENV NODE_ENV=production
COPY --from=build /app /app
EXPOSE 4000
CMD ["sh", "-c", "pnpm exec prisma migrate deploy && node dist/main.js"]
