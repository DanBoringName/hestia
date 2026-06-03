import { type DomainErrorCategory, isDomainError } from '@hestia/domain';
import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify';

const STATUS_BY_CATEGORY: Record<DomainErrorCategory, number> = {
  validation: 400,
  'not-found': 404,
  conflict: 409,
  forbidden: 403,
  unauthorized: 401,
};

/**
 * Maps typed domain errors to HTTP status codes at the boundary, exposing only
 * a stable `{ code, message }` shape. Anything else is logged and returned as a
 * generic 500 — stack traces and framework error shapes never reach the client.
 */
export function domainErrorHandler(
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply,
): FastifyReply {
  if (isDomainError(error)) {
    request.log.info({ code: error.code, category: error.category }, 'domain error');
    return reply
      .status(STATUS_BY_CATEGORY[error.category])
      .send({ error: { code: error.code, message: error.message } });
  }

  request.log.error({ err: error }, 'unhandled error');
  return reply
    .status(500)
    .send({ error: { code: 'INTERNAL', message: 'Internal Server Error' } });
}
