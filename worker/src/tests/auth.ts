import { test } from 'tap';
import { App } from '../app';
import { defaultConfig } from '../config';

const toBase64 = (s: string) => Buffer.from(s).toString('base64');

test('toBase64', async t => {
  t.same(toBase64('username:password'), 'dXNlcm5hbWU6cGFzc3dvcmQ=');
});

test('/auth', async t => {
  const app = App({
    ...defaultConfig,
    basicAuth: {
      realm: 'Realm',
      users: { username: 'user password' },
    },
  });

  const unauthorized = await app.inject({
    method: 'GET',
    url: '/auth',
  });

  t.same(unauthorized.statusCode, 401, 'disallows unauthenticated access');

  const wrongPassword = await app.inject({
    method: 'GET',
    url: '/auth',
    headers: {
      'WWW-Authenticate': 'Basic realm="Realm"',
      Authorization: `Basic ${toBase64('username:wrong password')}`,
    },
  });

  t.same(wrongPassword.statusCode, 401, 'disallows access when the password is wrong');

  const correctPassword = await app.inject({
    method: 'GET',
    url: '/auth',
    headers: {
      'WWW-Authenticate': 'Basic realm="Realm"',
      Authorization: `Basic ${toBase64('username:user password')}`,
    },
  });

  t.same(correctPassword.statusCode, 200, 'allows access when the password is correct');
});
