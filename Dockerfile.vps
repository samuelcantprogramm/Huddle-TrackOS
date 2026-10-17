# ==============================================================================
# Huddle TrackOS — Production Dockerfile
# Multi-stage lightweight Alpine container for full-stack deployment
# ==============================================================================

FROM node:20-alpine AS base

# Install curl for container health checks
RUN apk add --no-cache curl

WORKDIR /app

# Copy dependency manifests
COPY package.json ./
COPY backend/package.json ./backend/

# Install production dependencies
RUN npm install --prefix backend --omit=dev

# Copy application source code
COPY frontend/ ./frontend/
COPY backend/src/ ./backend/src/
COPY backend/scripts/ ./backend/scripts/
COPY sql/ ./sql/
COPY logo.png logo-mark.png favicon.png favicon.ico ./

# Create uploads directory
RUN mkdir -p backend/uploads

# Default production environment
ENV NODE_ENV=production
ENV PORT=5000

# Expose server port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:5000/health || exit 1

# Start the full-stack server
CMD ["node", "backend/src/server.js"]
