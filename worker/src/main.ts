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
    console.error('Invalid configuration file format.')
    process.exit(1);
  }
  config = result.right;
}

const app = App(config);
app.log.info('Configuration:');
app.log.info(config);

app.listen(config.port, '0.0.0.0').catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
