import * as t from 'io-ts';

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
}));
export type Config = Readonly<typeof Config._A>;

export const defaultConfig: Config = {
  port: 3001,
  basicAuth: undefined,
  logLevel: 'info',
} as const;
