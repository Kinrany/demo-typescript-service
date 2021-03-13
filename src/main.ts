import { App } from './app';

const PORT = 3000;

const app = App();

app.listen(PORT).catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
