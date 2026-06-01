import {
  CannotBefriendSelfError,
  FriendshipId,
  InvalidIdentifierError,
  Timestamp,
} from '@hestia/domain';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  fixedClock,
  InMemoryFriendshipRepository,
  SequentialIdGenerator,
} from '../testing/index.js';
import { DuplicateFriendshipError, RequestFriendship } from './request-friendship.js';

const NOW = Timestamp.fromISOString('2026-06-01T09:00:00.000Z');

let friendships: InMemoryFriendshipRepository;
let requestFriendship: RequestFriendship;

beforeEach(() => {
  friendships = new InMemoryFriendshipRepository();
  requestFriendship = new RequestFriendship(
    friendships,
    new SequentialIdGenerator('frn'),
    fixedClock(NOW),
  );
});

describe('RequestFriendship', () => {
  it('creates and persists a pending friendship stamped with the current time', async () => {
    const friendship = await requestFriendship.execute({
      requesterId: 'usr_a',
      addresseeId: 'usr_b',
    });

    expect(friendship.id).toBe('frn_1');
    expect(friendship.status).toBe('pending');
    expect(friendship.requestedAt.equals(NOW)).toBe(true);
    await expect(friendships.findById(FriendshipId('frn_1'))).resolves.not.toBeNull();
  });

  it('rejects a request that duplicates a live friendship, in either direction', async () => {
    await requestFriendship.execute({ requesterId: 'usr_a', addresseeId: 'usr_b' });

    await expect(
      requestFriendship.execute({ requesterId: 'usr_b', addresseeId: 'usr_a' }),
    ).rejects.toBeInstanceOf(DuplicateFriendshipError);
  });

  it('lets the domain reject a self-request', async () => {
    await expect(
      requestFriendship.execute({ requesterId: 'usr_a', addresseeId: 'usr_a' }),
    ).rejects.toBeInstanceOf(CannotBefriendSelfError);
  });

  it('rejects a malformed user id', async () => {
    await expect(
      requestFriendship.execute({ requesterId: 'usr_a', addresseeId: '' }),
    ).rejects.toBeInstanceOf(InvalidIdentifierError);
  });

  it('exposes the duplicate conflict as a DomainError', () => {
    expect(new DuplicateFriendshipError().code).toBe('DUPLICATE_FRIENDSHIP');
    expect(new DuplicateFriendshipError().category).toBe('conflict');
  });
});
