import type { UserRepository } from '@hestia/application';
import type { Email, Handle, User } from '@hestia/domain';
import type { PrismaClient } from '@prisma/client';

/**
 * Prisma-backed {@link UserRepository}. Maps the domain {@link User} to the
 * `users` table. `save` upserts by id so persisting an updated aggregate is
 * idempotent; existence checks back the registration uniqueness rules and lean
 * on the unique indexes.
 */
export class PrismaUserRepository implements UserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(user: User): Promise<void> {
    const fields = {
      email: user.email.value,
      handle: user.handle.value,
      displayName: user.displayName.value,
    };

    await this.prisma.user.upsert({
      where: { id: user.id },
      create: { id: user.id, ...fields },
      update: fields,
    });
  }

  async existsByHandle(handle: Handle): Promise<boolean> {
    const count = await this.prisma.user.count({ where: { handle: handle.value } });
    return count > 0;
  }

  async existsByEmail(email: Email): Promise<boolean> {
    const count = await this.prisma.user.count({ where: { email: email.value } });
    return count > 0;
  }
}
