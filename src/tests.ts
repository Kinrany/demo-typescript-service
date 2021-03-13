import { App } from './app';
import { test } from 'tap';

test('/health', async t => {
  const app = App();

  const response = await app.inject({ method: 'GET', url: '/health' });

  t.strictEquals(response.statusCode, 200, 'returns status code 200');
  t.strictEquals(response.body, 'OK\n', 'returns string "OK" that ends with EOL');
});
