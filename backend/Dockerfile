# ============================================================
# Inventory Management - Backend
# Production Dockerfile
# ============================================================

FROM node:22-alpine AS builder

WORKDIR /app

# Root workspace manifests
COPY package.json package-lock.json ./

# Backend workspace manifest
COPY backend/package.json ./backend/package.json

# Install all dependencies required for build
RUN npm ci

# Backend TypeScript configuration
COPY backend/tsconfig.json ./backend/tsconfig.json

# Backend source
COPY backend/src ./backend/src

# Database migrations
COPY backend/migrations ./backend/migrations

# Database seeds
COPY backend/seeds ./backend/seeds

# Build backend TypeScript
RUN npm run build:backend

# Verify production-required compiled files
RUN test -f backend/dist/server.js \
    && test -f backend/dist/database/migrate.js \
    && test -f backend/dist/database/seed.js


# ============================================================
# Production Runtime
# ============================================================

FROM node:22-alpine AS production

ENV NODE_ENV=production

WORKDIR /app

# Apply Alpine security updates
RUN apk upgrade --no-cache

# Root workspace manifests
COPY package.json package-lock.json ./

# Backend workspace manifest
COPY backend/package.json ./backend/package.json

# Install production dependencies only
RUN npm ci --omit=dev \
    && npm cache clean --force

# Copy compiled backend
COPY --from=builder /app/backend/dist ./backend/dist

# Copy database migrations
COPY --from=builder /app/backend/migrations ./backend/migrations

# Copy database seeds
COPY --from=builder /app/backend/seeds ./backend/seeds


# ============================================================
# Non-root Runtime User
# ============================================================

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


# ============================================================
# Backend Healthcheck
# ============================================================

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


# ============================================================
# Start Backend
# ============================================================

CMD ["node", "dist/server.js"]