# Use Node.js 18 Alpine as base image
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init libc6-compat

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including dev for build)
RUN npm ci

# Build stage
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build the TypeScript application
RUN npm run build

# Production stage
FROM base AS runner
WORKDIR /app

# Install dumb-init
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy package files and install production dependencies only
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy built application
COPY --from=builder /app/dist ./dist

# Create logs directory
RUN mkdir -p logs && chown -R nodejs:nodejs logs

# Change ownership of the app directory
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3030

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3030/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "dist/index.js"]
