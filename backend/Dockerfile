# Base Image for Build
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Stage 1: Install all dependencies and build
FROM base AS builder
COPY package*.json ./
RUN npm install
COPY . .
# Generate Prisma Client
RUN npx prisma generate
# Build NestJS
RUN npm run build
# Remove devDependencies safely
RUN npm prune --production

# Stage 2: Runner (Use Debian-based image for Playwright compatibility)
FROM node:20-slim AS runner
WORKDIR /app

ENV NODE_ENV=production

# Install system dependencies for Playwright/Chromium and Docker CLI
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    ca-certificates \
    curl \
    && curl -fsSL https://download.docker.com/linux/debian/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg \
    && echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/debian $(. /etc/os-release && echo "$VERSION_CODENAME") stable" > /etc/nginx/conf.d/docker.list \
    && apt-get update && apt-get install -y docker-ce-cli \
    && npx playwright install --with-deps chromium \
    && rm -rf /var/lib/apt/lists/*

# Copy built files and production node_modules from builder
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts

# Expose port
EXPOSE 3000

# Start the application with migrations
CMD npx playwright install chromium && npx prisma migrate deploy && npm run start:prod
