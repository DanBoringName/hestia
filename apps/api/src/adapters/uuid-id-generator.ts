import { randomUUID } from 'node:crypto';
import type { IdGenerator } from '@hestia/application';

/**
 * Production {@link IdGenerator} backed by a cryptographically-random UUID v4.
 * Keeps randomness at the edge; callers brand the result with the relevant id
 * factory (e.g. `UserId(...)`).
 */
export class UuidIdGenerator implements IdGenerator {
  generate(): string {
    return randomUUID();
  }
}
