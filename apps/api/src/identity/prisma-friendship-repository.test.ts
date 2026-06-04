import { Friendship, FriendshipId, Timestamp, UserId } from '@hestia/domain';
import { PrismaClient } from '@prisma/client';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { PrismaFriendshipRepository } from './prisma-friendship-repository.js';

const databaseUrl = process.env.DATABASE_URL;

describe.skipIf(!databaseUrl)('PrismaFriendshipRepository (integration)', () => {
  const prisma = new PrismaClient();
  const repository = new PrismaFriendshipRepository(prisma);

  const REQUESTER = UserId('usr_req');
  const ADDRESSEE = UserId('usr_addr');
  const REQUESTED_AT = Timestamp.fromISOString('2026-06-01T09:00:00.000Z');
  const RESPONDED_AT = Timestamp.fromISOString('2026-06-01T10:00:00.000Z');

  function pending(): Friendship {
    return Friendship.request({
      id: FriendshipId('frn_int_1'),
      requesterId: REQUESTER,
      addresseeId: ADDRESSEE,
      requestedAt: REQUESTED_AT,
    });
  }

  beforeEach(async () => {
    await prisma.friendship.deleteMany();
  });

  afterAll(async () => {
    await prisma.friendship.deleteMany();
    await prisma.$disconnect();
  });

  it('persists and reloads a friendship, preserving state', async () => {
    await repository.save(pending());

    const loaded = await repository.findById(FriendshipId('frn_int_1'));
    expect(loaded?.status).toBe('pending');
    expect(loaded?.requesterId).toBe('usr_req');
    expect(loaded?.requestedAt.equals(REQUESTED_AT)).toBe(true);
    expect(loaded?.respondedAt).toBeUndefined();
  });

  it('returns null for a missing id', async () => {
    expect(await repository.findById(FriendshipId('frn_missing'))).toBeNull();
  });

  it('upserts a transition by id, preserving respondedAt and staying single-row', async () => {
    await repository.save(pending());
    await repository.save(pending().accept(ADDRESSEE, RESPONDED_AT));

    const loaded = await repository.findById(FriendshipId('frn_int_1'));
    expect(loaded?.status).toBe('accepted');
    expect(loaded?.respondedAt?.equals(RESPONDED_AT)).toBe(true);
    expect(await prisma.friendship.count()).toBe(1);
  });

  it('reports active friendships in both directions and ignores terminal ones', async () => {
    await repository.save(pending());

    expect(await repository.existsActiveBetween(REQUESTER, ADDRESSEE)).toBe(true);
    expect(await repository.existsActiveBetween(ADDRESSEE, REQUESTER)).toBe(true);
    expect(await repository.existsActiveBetween(REQUESTER, UserId('usr_other'))).toBe(false);

    await repository.save(pending().decline(ADDRESSEE, RESPONDED_AT));
    expect(await repository.existsActiveBetween(REQUESTER, ADDRESSEE)).toBe(false);
  });
});
