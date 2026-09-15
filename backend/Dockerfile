# ============================================================
# Inventory Management - Backend
# Production Dockerfile
# ============================================================

FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
COPY backend/package.json ./backend/package.json

RUN npm ci

COPY backend/tsconfig.json ./backend/tsconfig.json
COPY backend/src ./backend/src
COPY backend/migrations ./backend/migrations
COPY backend/seeds ./backend/seeds

RUN npm run build:backend


# ============================================================
# Production Runtime
# ============================================================

FROM node:22-alpine AS production

ENV NODE_ENV=production

WORKDIR /app

RUN apk upgrade --no-cache

COPY package.json package-lock.json ./
COPY backend/package.json ./backend/package.json

RUN npm ci --omit=dev \
    && npm cache clean --force

COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/backend/migrations ./backend/migrations
COPY --from=builder /app/backend/seeds ./backend/seeds

RUN addgroup \
      --system \
      --gid 1001 \
      inventory \
    && adduser \
      --system \
      --uid 1001 \
      --ingroup inventory \
      inventory

RUN chown -R inventory:inventory /app

USER inventory

WORKDIR /app/backend

EXPOSE 4000

HEALTHCHECK \
  --interval=15s \
  --timeout=5s \
  --start-period=30s \
  --retries=5 \
  CMD node -e "\
    fetch('http://127.0.0.1:4000/api/health')\
      .then(response => {\
        if (!response.ok) process.exit(1);\
        process.exit(0);\
      })\
      .catch(() => process.exit(1))\
  "

CMD ["node", "dist/server.js"]