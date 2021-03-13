import Fastify from 'fastify';

const app = Fastify();

app.get("/health", async (_req, _res) => 'OK\n');

const PORT = 3000;

app.listen(PORT).catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
