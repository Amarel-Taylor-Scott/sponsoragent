FROM node:22-alpine AS base
WORKDIR /app
COPY package.json ./
RUN npm install
COPY . .

FROM base AS dev
CMD ["npx", "tsx", "watch", "src/index.ts"]

FROM base AS prod
RUN npm run build
CMD ["node", "dist/index.js"]
