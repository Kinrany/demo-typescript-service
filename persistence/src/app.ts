import Fastify from 'fastify';
import multipart from 'fastify-multipart';
import basicAuth from 'fastify-basic-auth';
import { Config, defaultConfig } from './config';

export const App = (config: Config = defaultConfig) => {
  const app = Fastify({
    logger: {
      prettyPrint: true,
      level: config.logLevel,
    }
  });

  app.register(multipart);

  if (config.basicAuth) {
    // otherwise `app.basicAuth` will stay undefined
    app.register(basicAuth, {
      authenticate: { realm: config.basicAuth.realm },
      validate: async (username, password) => {
        if (config.basicAuth!.users[username] !== password) {
          throw new Error('Unauthorized');
        }
      },
    });
  }

  app.after(() => {
    app.get("/health", async () => 'OK\n');

    app.get("/auth", {
      onRequest: app.basicAuth,
      handler: async () => 'OK\n',
    });
  });

  return app;
};
