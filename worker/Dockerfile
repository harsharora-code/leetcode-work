# Docker CLI is required to launch the separate, locked-down sandbox containers.
FROM docker:27-cli AS docker-cli

FROM oven/bun:1

WORKDIR /app

COPY --from=docker-cli /usr/local/bin/docker /usr/local/bin/docker

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .

CMD ["bun", "run", "index.ts"]
