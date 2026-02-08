# =========================
# Build stage
# =========================
FROM node:20-slim AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci

# Copy source and config
COPY src ./src
COPY tsconfig.json ./

# Build TypeScript
RUN npm run build


# =========================
# Production stage
# =========================
FROM node:20-slim AS production

WORKDIR /app
ENV NODE_ENV=production

# Copy package files and install prod deps only
COPY package*.json ./
RUN npm ci --omit=dev

# Copy compiled JavaScript from builder
COPY --from=builder /app/dist ./dist

# Start worker
CMD ["node", "dist/index.js"]