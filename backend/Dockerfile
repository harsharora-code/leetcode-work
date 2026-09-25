# Backend (Express + Prisma), deployed as a Bun service.
FROM oven/bun:1

WORKDIR /app

# Install deps first for better layer caching.
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# App source.
COPY . .

# The Prisma client is generated (not committed); emit it into ./generated/prisma.
RUN bunx prisma generate

# Render and other hosts inject PORT; index.ts reads process.env.PORT (falls back to 3000).
EXPOSE 3000
CMD ["bun", "run", "index.ts"]
