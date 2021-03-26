FROM node:14-alpine
WORKDIR /app

COPY package.json pnpm-lock.yaml tsconfig.json ./
RUN npx pnpm --prod --frozen-lockfile install

COPY src src/

VOLUME /config/config.json

ENTRYPOINT ["npm", "start"]
