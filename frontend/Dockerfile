FROM node:22-alpine AS base
WORKDIR /app
COPY package.json ./
RUN npm install
COPY . .

FROM base AS dev
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]

FROM base AS prod
RUN npm run build
CMD ["node", "build"]
