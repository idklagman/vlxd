FROM node:20-alpine AS base
RUN npm install -g pnpm

FROM base AS builder
WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile=false
RUN pnpm --filter @vlxd/shared build
RUN pnpm --filter @vlxd/db build
RUN pnpm --filter @vlxd/web build
RUN pnpm --filter @vlxd/api build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
COPY --from=builder /app /app
EXPOSE 3000

CMD ["node", "apps/api/dist/server.js"]
