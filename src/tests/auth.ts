import { test } from 'tap';
import { App } from '../app';
import { defaultConfig } from '../config';

test('/health', async t => {
  const app = App({
    ...defaultConfig,
    basicAuth: {
      realm: 'Realm',
      users: { 'user name': 'user password' },
    },
  });

  const unauthorized = await app.inject({
    method: 'GET',
    url: '/auth',
  });

  t.same(unauthorized.statusCode, 401, 'returns status code 401');
});
