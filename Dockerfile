# --- builder ---
FROM oven/bun:1 AS builder
WORKDIR /app

COPY bun.lockb package.json ./
RUN bun install --frozen-lockfile

COPY . .

# 빌드 시 production 환경 지정
ENV NODE_ENV=production
RUN bun run build

# --- runtime ---
FROM oven/bun:1
WORKDIR /app

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
CMD ["bun", "server.js"]
