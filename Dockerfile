# ---- Base image ----
FROM node:18-alpine AS base
WORKDIR /usr/src/app

# ---- Install dependencies ----
COPY package*.json ./
RUN npm install --omit=dev --no-audit --no-fund

# ---- Copy application source ----
COPY . .

# Render (and most PaaS providers) inject PORT at runtime.
# We still expose a default for local docker run usage.
EXPOSE 3000

# Run as a non-root user for better container security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

# Basic healthcheck hitting our /health endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:'+(process.env.PORT||3000)+'/health', r => process.exit(r.statusCode===200?0:1)).on('error', () => process.exit(1))"

CMD ["node", "server.js"]
