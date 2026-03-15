# =========================
# Build stage
# =========================
FROM node:20-slim AS builder

# Required for Prisma on Debian/slim images
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci

# Copy Prisma schema and generate the client
COPY prisma ./prisma
RUN npx prisma generate

# Copy source and config
COPY src ./src
COPY tsconfig.json ./

# Build TypeScript
RUN npm run build


# =========================
# Production stage
# =========================
FROM node:20-slim AS production

# Required for Prisma on Debian/slim images
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app
ENV NODE_ENV=production

# Copy package files and install prod deps only
COPY package*.json ./
RUN npm ci --omit=dev

# Copy Prisma schema and generate the client (needed at runtime)
COPY prisma ./prisma
RUN npx prisma generate

# Copy compiled JavaScript from builder
COPY --from=builder /app/dist ./dist

# Start worker
CMD ["node", "dist/index.js"]