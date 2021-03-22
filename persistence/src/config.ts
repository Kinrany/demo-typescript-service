import * as t from 'io-ts';

/**
 * Note that this config does not include database url.
 *
 * Instead it should be passed as environment variable
 * DATABASE_URL directly or using a `.env` file.
 */
export const Config = t.exact(t.type({
  port: t.number,
  basicAuth: t.union([t.undefined, t.type({
    users: t.record(t.string, t.string),
    realm: t.string,
  })]),
  // See https://getpino.io/#/docs/api?id=loggerlevels-object
  logLevel: t.union([
    t.literal('trace'),
    t.literal('debug'),
    t.literal('info'),
    t.literal('warn'),
    t.literal('error'),
    t.literal('fatal'),
  ]),
  workerHost: t.string,
}));
export type Config = Readonly<typeof Config._A>;

export const defaultConfig: Config = {
  port: 3001,
  basicAuth: undefined,
  logLevel: 'info',
  workerHost: '0.0.0.0:3000',
} as const;
