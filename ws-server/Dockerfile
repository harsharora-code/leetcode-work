# WebSocket server. Must run on Bun (uses Bun.serve and other Bun-native APIs).
FROM oven/bun:1

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .

# Hosts inject PORT; index.ts binds WS_PORT ?? PORT ?? 8081.
EXPOSE 8081
CMD ["bun", "run", "index.ts"]
