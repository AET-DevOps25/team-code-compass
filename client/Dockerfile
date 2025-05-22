FROM node:20-alpine AS builder

WORKDIR /app

COPY . .

RUN npm install --legacy-peer-deps

RUN npm run build

FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/package-lock.json ./package-lock.json
COPY --from=builder /app/next.config.mjs ./next.config.mjs

EXPOSE 3000

CMD ["npm", "start"]
