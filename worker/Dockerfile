# =========================
# Build stage
# =========================
FROM node:20-slim AS builder

WORKDIR /app

# Copy package files first for caching
COPY package*.json ./

RUN npm ci

# Copy prisma schema (if worker uses Prisma)
COPY prisma ./prisma/
RUN npx prisma generate

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build


# =========================
# Production stage
# =========================
FROM node:20-slim AS production

WORKDIR /app
ENV NODE_ENV=production

# Install OpenSSL (required for Prisma)
RUN apt-get update \
  && apt-get install -y openssl \
  && rm -rf /var/lib/apt/lists/*

# Copy package files and install prod deps
COPY package*.json ./
RUN npm ci --omit=dev

# Copy prisma and generate client again
COPY prisma ./prisma/
RUN npx prisma generate

# Copy compiled JS
COPY --from=builder /app/dist ./dist

# Start worker
CMD ["node", "dist/jobs/email.worker.js"]
