import Fastify from 'fastify';

export const App = () => {
  const app = Fastify();

  app.get("/health", async (_req, _res) => 'OK\n');

  return app;
};
