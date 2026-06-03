# syntax=docker/dockerfile:1

FROM node:20-slim AS deps
RUN corepack enable
WORKDIR /app
COPY pnpm-lock.yaml package.json pnpm-workspace.yaml turbo.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/admin/package.json ./apps/admin/
RUN pnpm install --frozen-lockfile

FROM node:20-slim AS build
RUN corepack enable
WORKDIR /app
COPY --from=deps /app /app
COPY packages/shared ./packages/shared
COPY apps/admin ./apps/admin
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_SHOW_QA_CREDENTIALS
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_SHOW_QA_CREDENTIALS=$NEXT_PUBLIC_SHOW_QA_CREDENTIALS
RUN pnpm --filter @foyer/shared build \
 && pnpm --filter @foyer/admin build

FROM node:20-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
COPY --from=build /app/apps/admin/.next/standalone ./
COPY --from=build /app/apps/admin/.next/static ./apps/admin/.next/static
COPY --from=build /app/apps/admin/public ./apps/admin/public
EXPOSE 3000
CMD ["node", "apps/admin/server.js"]
