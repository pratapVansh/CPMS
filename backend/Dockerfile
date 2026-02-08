# =========================
# Build stage
# =========================
FROM node:20-slim AS builder

WORKDIR /app

# Copy only package files first (better caching)
COPY package.json package-lock.json ./

# Install all deps (including dev deps for build)
RUN npm ci

# Copy prisma schema and generate client
COPY prisma ./prisma
RUN npx prisma generate

# Copy rest of the source code
COPY . .

# Build the app
RUN npm run build


# =========================
# Production stage
# =========================
FROM node:20-slim AS production

WORKDIR /app

ENV NODE_ENV=production

# Prisma needs OpenSSL
RUN apt-get update \
  && apt-get install -y openssl \
  && rm -rf /var/lib/apt/lists/*

# Copy package files again
COPY package.json package-lock.json ./

# Install only production deps
RUN npm ci --omit=dev

# Copy prisma schema AND generated client from builder
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/prisma ./prisma

# Copy built app
COPY --from=builder /app/dist ./dist

# Expose backend port (change if needed)
EXPOSE 5000

# Start server
CMD ["node", "dist/server.js"]
