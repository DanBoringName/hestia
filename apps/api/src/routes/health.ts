import type { FastifyInstance } from 'fastify';

/** Liveness probe — confirms the process is up and serving. */
export function registerHealthRoute(app: FastifyInstance): void {
  app.get('/health', () => ({ status: 'ok' }));
}
