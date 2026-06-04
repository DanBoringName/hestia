import type { BlockRepository } from '@hestia/application';
import type { Block, UserId } from '@hestia/domain';
import type { PrismaClient } from '@prisma/client';
import { toDate } from '../adapters/timestamps.js';

/**
 * Prisma-backed {@link BlockRepository}. A block is binary and never loaded as
 * an entity, so there is no reconstitution: `save` upserts on the unique
 * (blocker, blocked) pair (idempotent placement), existence is a directional
 * count, and removal is a `deleteMany` (a no-op when none exists).
 */
export class PrismaBlockRepository implements BlockRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(block: Block): Promise<void> {
    await this.prisma.block.upsert({
      where: { blockerId_blockedId: { blockerId: block.blockerId, blockedId: block.blockedId } },
      create: {
        id: block.id,
        blockerId: block.blockerId,
        blockedId: block.blockedId,
        blockedAt: toDate(block.blockedAt),
      },
      update: {},
    });
  }

  async existsByBlockerAndBlocked(blockerId: UserId, blockedId: UserId): Promise<boolean> {
    const count = await this.prisma.block.count({ where: { blockerId, blockedId } });
    return count > 0;
  }

  async removeByBlockerAndBlocked(blockerId: UserId, blockedId: UserId): Promise<void> {
    await this.prisma.block.deleteMany({ where: { blockerId, blockedId } });
  }
}
