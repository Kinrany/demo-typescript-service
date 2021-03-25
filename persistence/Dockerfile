FROM node:14-alpine AS build
WORKDIR /app

COPY package.json pnpm-lock.yaml tsconfig.json ./
RUN npx pnpm --prod --frozen-lockfile install

COPY prisma prisma/
RUN npx --no-install prisma generate

COPY src src/
RUN npm run esbuild


FROM node:14-alpine
WORKDIR /app

COPY --from=build /app/dist/main.js .

VOLUME /config/config.json

ENTRYPOINT ["node", "main.js"]
