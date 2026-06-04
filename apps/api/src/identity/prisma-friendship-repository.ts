import type { FriendshipRepository } from '@hestia/application';
import { Friendship, FriendshipId, UserId } from '@hestia/domain';
import type { PrismaClient } from '@prisma/client';
import { toDate, toTimestamp } from '../adapters/timestamps.js';

/**
 * Prisma-backed {@link FriendshipRepository}. `save` upserts by id so any state
 * transition persists idempotently; `findById` rebuilds the aggregate via
 * {@link Friendship.reconstitute}; `existsActiveBetween` checks both directions
 * for a non-terminal (pending/accepted) friendship.
 */
export class PrismaFriendshipRepository implements FriendshipRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(friendship: Friendship): Promise<void> {
    const fields = {
      requesterId: friendship.requesterId,
      addresseeId: friendship.addresseeId,
      status: friendship.status,
      requestedAt: toDate(friendship.requestedAt),
      respondedAt: friendship.respondedAt ? toDate(friendship.respondedAt) : null,
      endedAt: friendship.endedAt ? toDate(friendship.endedAt) : null,
    };

    await this.prisma.friendship.upsert({
      where: { id: friendship.id },
      create: { id: friendship.id, ...fields },
      update: fields,
    });
  }

  async findById(id: FriendshipId): Promise<Friendship | null> {
    const row = await this.prisma.friendship.findUnique({ where: { id } });
    if (row === null) {
      return null;
    }

    return Friendship.reconstitute({
      id: FriendshipId(row.id),
      requesterId: UserId(row.requesterId),
      addresseeId: UserId(row.addresseeId),
      status: row.status,
      requestedAt: toTimestamp(row.requestedAt),
      respondedAt: row.respondedAt ? toTimestamp(row.respondedAt) : undefined,
      endedAt: row.endedAt ? toTimestamp(row.endedAt) : undefined,
    });
  }

  async existsActiveBetween(a: UserId, b: UserId): Promise<boolean> {
    const count = await this.prisma.friendship.count({
      where: {
        status: { in: ['pending', 'accepted'] },
        OR: [
          { requesterId: a, addresseeId: b },
          { requesterId: b, addresseeId: a },
        ],
      },
    });

    return count > 0;
  }
}
