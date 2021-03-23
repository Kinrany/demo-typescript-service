FROM node:14-alpine
WORKDIR /app

RUN npm i -g pnpm
COPY package.json pnpm-lock.yaml tsconfig.json ./
RUN pnpm --prod --frozen-lockfile install

COPY src src/

VOLUME /config/config.json

ENTRYPOINT ["pnpm", "start"]
