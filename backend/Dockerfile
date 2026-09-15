# ============================================================
# Inventory Management - Backend
# Production Dockerfile
# ============================================================

FROM node:22-alpine AS builder

WORKDIR /app

# Root workspace files
COPY package.json package-lock.json ./

# Backend package
COPY backend/package.json ./backend/package.json

# Install dependencies
RUN npm ci

# Backend source
COPY backend/tsconfig.json ./backend/tsconfig.json
COPY backend/src ./backend/src

# Build backend
RUN npm run build:backend


# ============================================================
# Production Runtime
# ============================================================

FROM node:22-alpine AS production

ENV NODE_ENV=production

WORKDIR /app

# Security updates
RUN apk upgrade --no-cache

# Root workspace files
COPY package.json package-lock.json ./

# Backend package
COPY backend/package.json ./backend/package.json

# Install production dependencies only
RUN npm ci --omit=dev \
    && npm cache clean --force

# Copy compiled backend
COPY --from=builder /app/backend/dist ./backend/dist

# Create non-root application user
RUN addgroup \
      --system \
      --gid 1001 \
      inventory \
    && adduser \
      --system \
      --uid 1001 \
      --ingroup inventory \
      inventory

# Application ownership
RUN chown -R inventory:inventory /app

USER inventory

WORKDIR /app/backend

EXPOSE 4000

# Container health check
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