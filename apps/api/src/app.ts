import Fastify, { type FastifyInstance } from 'fastify';
import type { Env } from './config/env.js';
import { registerHealthRoute } from './routes/health.js';

/**
 * Builds the Fastify instance with its routes wired. Kept free of process
 * concerns (listening, signals) so tests can drive it via `app.inject`.
 */
export function buildApp(env: Env): FastifyInstance {
  const app = Fastify({
    logger: { level: env.LOG_LEVEL },
  });

  registerHealthRoute(app);

  return app;
}
