FROM node:22-bookworm-slim

WORKDIR /app

RUN npm install --global bun@1

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .
RUN bun run build:web

EXPOSE 8787

CMD ["./node_modules/.bin/wrangler", "dev", "--ip", "0.0.0.0", "--port", "8787", "--persist-to", "/data"]
