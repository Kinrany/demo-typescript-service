import Fastify from 'fastify';
import multipart from 'fastify-multipart';
import basicAuth from 'fastify-basic-auth';
import { Config, defaultConfig } from './config';
import { PrismaClient, Prisma } from '@prisma/client';
import * as t from 'io-ts';
import { isLeft } from 'fp-ts/lib/Either';
import { JsonArray, JsonRecord } from 'io-ts-types';

const badRequestError = (errors: t.Errors) => ({
  code: 'BadRequest',
  message: `Invalid request with ${errors.length} errors.`,
  details: errors,
});

const documentNotFoundError = (documentId: string) => ({
  code: 'DocumentNotFound',
  message: `Couldn't find document with uuid "${documentId}".`,
  details: { documentId },
});

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
        return reply.status(400).send(badRequestError(validation.left));
      }
      const { params: { documentId } } = validation.right;

      const document = await prisma.document.findUnique({
        where: { uuid: documentId },
        select: { uuid: true, document: true, created_at: true },
      });
      if (document === null) {
        return reply.status(404).send(documentNotFoundError(documentId));
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

    const PatchDocumentRequest = t.type({
      params: t.type({
        documentId: t.string,
      }),
      body: t.unknown,
    }, 'PatchDocumentRequest');

    app.patch("/document/:documentId", {
      onRequest: app.basicAuth,
      handler: async (request, reply) => {
        // validate request
        const validation = PatchDocumentRequest.decode(request);
        if (isLeft(validation)) {
          return reply.status(400).send(badRequestError(validation.left));
        }
        const { params: { documentId }, body: patch } = validation.right;

        // get saved document
        const document = await prisma.document.findUnique({
          where: { uuid: documentId },
        });
        if (document === null) {
          return reply.status(404).send(documentNotFoundError(documentId));
        }

        // send the document and the patch to the worker,
        // get the new document with patch applied
        const url = `${config.workerHost}/apply-json-patch`;
        let patchedDocument!: Prisma.InputJsonValue;
        try {
          const response = await fetch(url, { body: JSON.stringify({ document, patch }) });
          const json = await response.json();
          if (!t.union([JsonArray, JsonRecord]).is(json)) {
            throw new Error();
          }
          patchedDocument = json as Prisma.InputJsonValue;
        }
        catch (e: unknown) {
          const error = {
            code: 'WorkerError',
            message: `Worker request failed: "${url}".`,
            details: { url, document, patch },
          };
          request.log.error(error);
          return reply.status(500).send(error);
        }

        // save the document to the database, checking that
        // the document has not been updated in the meantime
        // (see https://en.wikipedia.org/wiki/Optimistic_concurrency_control)
        const updated = await prisma.document.updateMany({
          where: {
            uuid: documentId,
            version: document.version,
          },
          data: {
            document: patchedDocument,
            version: {
              increment: 1,
            },
          },
        });
        if (updated.count === 0) {
          return reply.status(503).header('Retry-After', 0).send({
            code: 'DocumentUpdateConflict',
            message: 'Document changed while this request was being processed.',
            details: `Please retry. Another request changed document "${documentId}" while the current request was being processed.`,
          });
        }
        else {
          return {
            uuid: documentId,
            document: patchedDocument,
          };
        }
      },
    })
  });

  return app;
};
