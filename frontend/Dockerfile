# ============================================================
# Inventory Management - Frontend
# Production Dockerfile
# ============================================================

FROM node:22-alpine AS builder

WORKDIR /app

# Root workspace files
COPY package.json package-lock.json ./

# Frontend workspace
COPY frontend/package.json ./frontend/package.json

# Install dependencies
RUN npm ci

# Frontend source/configuration
COPY frontend/tsconfig.json ./frontend/tsconfig.json
COPY frontend/tsconfig.app.json ./frontend/tsconfig.app.json
COPY frontend/tsconfig.node.json ./frontend/tsconfig.node.json
COPY frontend/vite.config.ts ./frontend/vite.config.ts
COPY frontend/src ./frontend/src
COPY frontend/public ./frontend/public

# Production frontend configuration
ARG VITE_APP_NAME="Inventory Management"
ARG VITE_API_BASE_URL="/api"

ENV VITE_APP_NAME=${VITE_APP_NAME}
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

# Build
RUN npm run build:frontend


# ============================================================
# Production Nginx
# ============================================================

FROM nginx:1.29-alpine AS production

# Security updates
RUN apk upgrade --no-cache

# Remove default Nginx content
RUN rm -rf /usr/share/nginx/html/*

# Copy compiled frontend
COPY --from=builder /app/frontend/dist /usr/share/nginx/html

# Nginx configuration
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Container health check
HEALTHCHECK \
  --interval=15s \
  --timeout=5s \
  --start-period=20s \
  --retries=5 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1/ || exit 1

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]