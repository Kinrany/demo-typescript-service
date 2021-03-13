import Fastify from 'fastify';
import multipart from 'fastify-multipart';
import { isLeft } from 'fp-ts/lib/Either';
import * as t from 'io-ts';
import { Json } from 'io-ts-types'
import { apply_patch, InvalidPatch, PatchApplyError } from 'jsonpatch';
import sharp from 'sharp';

declare module 'jsonpatch' {
  export class InvalidPatch extends Error {}
  export class PatchApplyError extends Error {}
}

export const App = () => {
  const app = Fastify();

  app.register(multipart);

  app.get("/health", async () => 'OK\n');

  // Request schema for POST /apply-json-patch
  const ApplyJsonPatchRequest = t.type({
    body: t.exact(t.type({
      document: Json,
      patch: t.array(Json),
    })),
  });

  app.post("/apply-json-patch", async (request, reply) => {
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
  });

  const WIDTH = 200;
  const HEIGHT = 200;

  app.post("/generate-thumbnail", async (request, reply) => {
    const file = await request.file();
    const fileStream = file.file;

    const resizer = sharp()
      .resize(WIDTH, HEIGHT, { fit: 'outside' })
      .toFormat('jpeg');

    return reply.send(fileStream.pipe(resizer));
  });

  return app;
};
