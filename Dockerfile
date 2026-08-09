# Base image configuration
FROM node:18-alpine AS base
WORKDIR /usr/src/app

# Install dependencies
COPY package*.json ./
RUN npm install --omit=dev --no-audit --no-fund

# Copy application source
COPY . .

# Hosting providers inject port at runtime
# Expose default port for local docker usage
EXPOSE 3000

# Run as non root user for stronger container security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

# Health check request against health endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:'+(process.env.PORT||3000)+'/health', r => process.exit(r.statusCode===200?0:1)).on('error', () => process.exit(1))"

CMD ["node", "server.js"]
