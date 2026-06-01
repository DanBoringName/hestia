import type { DomainError } from '@hestia/domain';

/**
 * Returns a repository lookup result, or throws the supplied not-found error
 * when it is absent. Consolidates the load-by-id-then-guard idiom shared by use
 * cases that operate on an existing aggregate. The error is built lazily, so no
 * allocation happens on the found path.
 */
export function requireFound<T>(value: T | null, makeError: () => DomainError): T {
  if (value === null) {
    throw makeError();
  }
  return value;
}
