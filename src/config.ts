import * as t from 'io-ts';

export const Config = t.exact(t.type({
  port: t.number,
  thumbnailHeight: t.number,
  thumbnailWidth: t.number,
}));
export type Config = typeof Config._A;

export const defaultConfig: Config = {
  port: 3000,
  thumbnailHeight: 200,
  thumbnailWidth: 200
} as const;
