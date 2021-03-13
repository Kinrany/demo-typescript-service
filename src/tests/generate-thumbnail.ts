import * as fs from 'fs';
import * as path from 'path';
import * as util from 'util';
import FormData from 'form-data';
import { test } from 'tap';
import { App } from '../app';

const readFile = util.promisify(fs.readFile);

test('/generate-thumbnail', async t => {
  const app = App();

  const fileName = 'source-image.png';
  const form = new FormData();
  form.append(fileName, fs.createReadStream(path.resolve(__dirname, fileName)));

  const response = await app.inject({
    method: 'POST',
    url: '/generate-thumbnail',
    payload: form,
    headers: form.getHeaders(),
  });

  t.same(response.statusCode, 200, 'returns status code 200');

  const expectedFile = await readFile(path.resolve(__dirname, 'expected-image.jpeg'));

  t.same(response.rawPayload, expectedFile);
});
