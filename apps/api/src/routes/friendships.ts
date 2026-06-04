import type { RequestFriendship, RespondToFriendship } from '@hestia/application';
import type { Friendship } from '@hestia/domain';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

// INTERIM: the acting user (requesterId / actorId) is taken from the request
// body. This is an insecure stand-in until Better Auth supplies the actor from
// the authenticated session — at which point these fields come from the session,
// not the client.
const requestBody = z.object({
  requesterId: z.string(),
  addresseeId: z.string(),
});

const responseBody = z.object({
  actorId: z.string(),
  response: z.enum(['accept', 'decline']),
});

function serialize(friendship: Friendship) {
  return {
    id: friendship.id,
    requesterId: friendship.requesterId,
    addresseeId: friendship.addresseeId,
    status: friendship.status,
    requestedAt: friendship.requestedAt.toISOString(),
    respondedAt: friendship.respondedAt?.toISOString() ?? null,
    endedAt: friendship.endedAt?.toISOString() ?? null,
  };
}

export function registerFriendshipRoutes(
  app: FastifyInstance,
  requestFriendship: RequestFriendship,
  respondToFriendship: RespondToFriendship,
): void {
  app.post('/friendships', async (request, reply) => {
    const parsed = requestBody.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: { code: 'INVALID_REQUEST', message: 'Invalid request body.', details: parsed.error.issues },
      });
    }

    const friendship = await requestFriendship.execute(parsed.data);
    return reply.status(201).send(serialize(friendship));
  });

  app.post<{ Params: { id: string } }>('/friendships/:id/response', async (request, reply) => {
    const parsed = responseBody.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: { code: 'INVALID_REQUEST', message: 'Invalid request body.', details: parsed.error.issues },
      });
    }

    const friendship = await respondToFriendship.execute({
      friendshipId: request.params.id,
      actorId: parsed.data.actorId,
      response: parsed.data.response,
    });
    return reply.status(200).send(serialize(friendship));
  });
}
