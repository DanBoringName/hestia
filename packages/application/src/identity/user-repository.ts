import type { Email, Handle, User } from '@hestia/domain';

/**
 * Persistence port for {@link User} aggregates. Existence checks back the
 * handle/email uniqueness rules enforced when registering a user; richer
 * lookups are added as use cases need them. Implemented by a Prisma adapter
 * in apps/api and by an in-memory fake in tests.
 */
export interface UserRepository {
  save(user: User): Promise<void>;
  existsByHandle(handle: Handle): Promise<boolean>;
  existsByEmail(email: Email): Promise<boolean>;
}
