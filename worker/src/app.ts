import * as stream from 'stream';
import { promisify } from 'util';
import Fastify from 'fastify';
import multipart from 'fastify-multipart';
import basicAuth from 'fastify-basic-auth';
import { isLeft } from 'fp-ts/lib/Either';
import * as t from 'io-ts';
import { Json } from 'io-ts-types'
import { apply_patch, InvalidPatch, PatchApplyError } from 'jsonpatch';
import sharp from 'sharp';
import { Config, defaultConfig } from './config';

const pipeline = promisify(stream.pipeline);

declare module 'jsonpatch' {
  export class InvalidPatch extends Error {}
  export class PatchApplyError extends Error {}
}

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

    // Request schema for POST /apply-json-patch
    const ApplyJsonPatchRequest = t.type({
      body: t.exact(t.type({
        document: Json,
        patch: t.array(Json),
      })),
    });

    app.post("/apply-json-patch", {
      onRequest: app.basicAuth,
      handler: async (request, reply) => {
        const result = ApplyJsonPatchRequest.decode(request);
        if (isLeft(result)) {
          return reply.status(400).send(`Invalid request with ${result.left.length} errors.`);
        }
        const { document, patch } = result.right.body;

        try {
          return apply_patch(document, patch);
        }
        catch (e: unknown) {
          if (e instanceof InvalidPatch) {
            return reply.status(400).send({
              code: 'InvalidPatch',
              message: 'Not a valid RFC 6902 JSON patch.',
              details: e.toString(),
            });
          }
          else if (e instanceof PatchApplyError) {
            return reply.status(400).send({
              code: 'PatchApplyError',
              message: 'Cannot apply the given patch to the given document.',
              details: e.toString(),
            });
          }
          else {
            return reply.status(500).send({
              code: 'InternalError',
              message: 'Unknown server error',
              details: (e instanceof Error) ? e.toString() : ''
            });
          }
        }
      }
    });

    app.post("/generate-thumbnail", {
      onRequest: app.basicAuth,
      handler: async (request, reply) => {
        const file = await request.file();
        const fileStream = file.file;

        const resizer = sharp().resize(config.thumbnailWidth, config.thumbnailHeight).toFormat('jpeg');

        await pipeline(fileStream.pipe(resizer), reply.raw);
      }
    });
  });

  return app;
};
