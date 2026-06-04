import Fastify, { type FastifyInstance } from 'fastify';
import type { Env } from './config/env.js';
import type { Container } from './container.js';
import { domainErrorHandler } from './errors/error-handler.js';
import { registerBlockRoutes } from './routes/blocks.js';
import { registerFriendshipRoutes } from './routes/friendships.js';
import { registerHealthRoute } from './routes/health.js';
import { registerUserRoutes } from './routes/users.js';

/**
 * Builds the Fastify instance with its error handler and routes wired to the
 * supplied dependencies. Kept free of process concerns (listening, signals) and
 * of how dependencies are constructed, so tests can drive it via `app.inject`
 * with in-memory use cases.
 */
export function buildApp(env: Env, container: Container): FastifyInstance {
  const app = Fastify({
    logger: { level: env.LOG_LEVEL },
  });

  app.setErrorHandler(domainErrorHandler);

  registerHealthRoute(app);
  registerUserRoutes(app, container.registerUser);
  registerFriendshipRoutes(app, container.requestFriendship, container.respondToFriendship);
  registerBlockRoutes(app, container.blockUser, container.unblockUser);

  return app;
}
