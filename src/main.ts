import { isLeft } from 'fp-ts/lib/Either';
import * as fs from 'fs';
import * as path from 'path';
import { App } from './app';
import { Config, defaultConfig } from './config';

const configPath = process.env['CONFIG_PATH'] || path.resolve(__dirname, '../config.json');

let config = defaultConfig;
if (fs.existsSync(configPath)) {
  const json = fs.readFileSync(configPath).toString();
  const result = Config.decode(JSON.parse(json));
  if (isLeft(result)) {
    console.error('Invalid config.')
    process.exit(1);
  }
  config = result.right;
}
console.log('Configuration:');
console.log(config);

const app = App();

app.listen(config.port).catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
