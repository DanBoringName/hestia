import { Block, BlockId, Timestamp, UserId } from '@hestia/domain';
import { PrismaClient } from '@prisma/client';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { PrismaBlockRepository } from './prisma-block-repository.js';

const databaseUrl = process.env.DATABASE_URL;

describe.skipIf(!databaseUrl)('PrismaBlockRepository (integration)', () => {
  const prisma = new PrismaClient();
  const repository = new PrismaBlockRepository(prisma);

  const BLOCKER = UserId('usr_blocker');
  const BLOCKED = UserId('usr_blocked');
  const NOW = Timestamp.fromISOString('2026-06-01T09:00:00.000Z');

  function block(): Block {
    return Block.place({
      id: BlockId('blk_int_1'),
      blockerId: BLOCKER,
      blockedId: BLOCKED,
      blockedAt: NOW,
    });
  }

  beforeEach(async () => {
    await prisma.block.deleteMany();
  });

  afterAll(async () => {
    await prisma.block.deleteMany();
    await prisma.$disconnect();
  });

  it('persists a block and reports existence directionally', async () => {
    await repository.save(block());

    expect(await repository.existsByBlockerAndBlocked(BLOCKER, BLOCKED)).toBe(true);
    expect(await repository.existsByBlockerAndBlocked(BLOCKED, BLOCKER)).toBe(false);
  });

  it('is idempotent on save for the same pair', async () => {
    await repository.save(block());
    await repository.save(block());

    expect(await prisma.block.count()).toBe(1);
  });

  it('removes by pair and is a no-op when none exists', async () => {
    await repository.save(block());

    await repository.removeByBlockerAndBlocked(BLOCKER, BLOCKED);
    expect(await repository.existsByBlockerAndBlocked(BLOCKER, BLOCKED)).toBe(false);

    await expect(
      repository.removeByBlockerAndBlocked(BLOCKER, BLOCKED),
    ).resolves.toBeUndefined();
  });
});
