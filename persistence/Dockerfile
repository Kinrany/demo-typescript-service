FROM node:14-alpine
WORKDIR /app

RUN npm i -g pnpm
COPY package.json pnpm-lock.yaml .
RUN pnpm --prod --frozen-lockfile install

COPY src tsconfig.json .

VOLUME /config/config.json

ENTRYPOINT ["pnpm", "start"]
