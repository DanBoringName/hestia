import type { RegisterUser } from '@hestia/application';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

// Boundary shape check only: confirms the three fields are present strings.
// Domain validity (email format, handle rules, length) is enforced by the use
// case's value objects, which raise typed errors mapped by the error handler.
const registerUserBody = z.object({
  email: z.string(),
  handle: z.string(),
  displayName: z.string(),
});

/** Thin controller: parse, call the use case, format the response. No business logic. */
export function registerUserRoutes(app: FastifyInstance, registerUser: RegisterUser): void {
  app.post('/users', async (request, reply) => {
    const parsed = registerUserBody.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: {
          code: 'INVALID_REQUEST',
          message: 'Invalid request body.',
          details: parsed.error.issues,
        },
      });
    }

    const user = await registerUser.execute(parsed.data);

    return reply.status(201).send({
      id: user.id,
      email: user.email.value,
      handle: user.handle.value,
      displayName: user.displayName.value,
    });
  });
}
