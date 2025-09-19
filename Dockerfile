# 빌드
From node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm install

# COPY . .
COPY next.config.ts ./
COPY public ./public
COPY src ./src

RUN npm run build

# 실행
FROM node:20-alpine
WORKDIR /app

# 빌드된 파일 복사
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
CMD ["node", "server.js"]