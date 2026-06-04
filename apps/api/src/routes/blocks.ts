import type { BlockUser, UnblockUser } from '@hestia/application';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

// INTERIM: blockerId is the acting user, taken from the body until Better Auth
// supplies it from the session. Both operations are idempotent and return 204.
const blockBody = z.object({
  blockerId: z.string(),
  blockedId: z.string(),
});

export function registerBlockRoutes(
  app: FastifyInstance,
  blockUser: BlockUser,
  unblockUser: UnblockUser,
): void {
  app.post('/blocks', async (request, reply) => {
    const parsed = blockBody.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: { code: 'INVALID_REQUEST', message: 'Invalid request body.', details: parsed.error.issues },
      });
    }

    await blockUser.execute(parsed.data);
    return reply.status(204).send();
  });

  app.delete('/blocks', async (request, reply) => {
    const parsed = blockBody.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: { code: 'INVALID_REQUEST', message: 'Invalid request body.', details: parsed.error.issues },
      });
    }

    await unblockUser.execute(parsed.data);
    return reply.status(204).send();
  });
}
