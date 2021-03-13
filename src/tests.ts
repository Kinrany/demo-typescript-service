import { App } from './app';
import { test } from 'tap';

test('/health', async t => {
  const app = App();

  const response = await app.inject({ method: 'GET', url: '/health' });

  t.same(response.statusCode, 200, 'returns status code 200');
  t.same(response.body, 'OK\n', 'returns string "OK" that ends with EOL');
});

test('/apply-json-patch', async t => {
  const app = App();

  const document ={
    data: {
      value: 100
    }
  };

  const patch = [
    { op: 'add', path: '/data/value', value: 200 }
  ];

  const expected = {
    data: {
      value: 200
    }
  };

  const response = await app.inject({
    method: 'POST',
    url: '/apply-json-patch',
    payload: { document, patch }
  });

  t.same(response.statusCode, 200, 'returns status code 200');
  t.same(response.json(), expected, 'returns updated document');
});
