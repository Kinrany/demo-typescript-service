import Fastify from 'fastify';
import multipart from 'fastify-multipart';
import basicAuth from 'fastify-basic-auth';
import { Config, defaultConfig } from './config';
import { PrismaClient, Prisma } from '@prisma/client';
import * as t from 'io-ts';
import { isLeft } from 'fp-ts/lib/Either';

export const App = (config: Config = defaultConfig) => {
  const prisma = new PrismaClient();

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

    const GetDocumentRequest = t.type({
      params: t.type({
        documentId: t.string,
      }),
    }, 'GetDocumentRequest');

    app.get("/document/:documentId", async (request, reply) => {
      const validation = GetDocumentRequest.decode(request);
      if (isLeft(validation)) {
        return reply.status(400).send({
          code: 'InvalidRequest',
          message: `Invalid request with ${validation.left.length} errors.`,
          details: validation.left,
        });
      }
      const { params: { documentId } } = validation.right;

      const document = await prisma.document.findUnique({
        where: { uuid: documentId },
        select: { uuid: true, document: true, created_at: true },
      });
      if (document === null) {
        return reply.status(404).send({
          code: 'DocumentNotFound',
          message: `Couldn't find document with uuid "${documentId}".`,
          details: { documentId },
        });
      }

      return document;
    });

    app.post("/document", {
      onRequest: app.basicAuth,
      handler: async request => {
        const document = await prisma.document.create({
          data: {
            // Fastify parses request body as JSON by default.
            document: request.body as Prisma.InputJsonValue,
          },
          select: { uuid: true, document: true, created_at: true },
        });

        return document;
      }
    });
  });

  return app;
};
