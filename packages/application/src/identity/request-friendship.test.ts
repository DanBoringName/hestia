import {
  CannotBefriendSelfError,
  Friendship,
  FriendshipId,
  InvalidIdentifierError,
  Timestamp,
  UserId,
} from '@hestia/domain';
import { beforeEach, describe, expect, it } from 'vitest';
import type { Clock } from '../ports/clock.js';
import type { IdGenerator } from '../ports/id-generator.js';
import type { FriendshipRepository } from './friendship-repository.js';
import { DuplicateFriendshipError, RequestFriendship } from './request-friendship.js';

class InMemoryFriendshipRepository implements FriendshipRepository {
  readonly items: Friendship[] = [];

  async save(friendship: Friendship): Promise<void> {
    const index = this.items.findIndex((item) => item.id === friendship.id);
    if (index >= 0) {
      this.items[index] = friendship;
    } else {
      this.items.push(friendship);
    }
  }

  async findById(id: FriendshipId): Promise<Friendship | null> {
    return this.items.find((item) => item.id === id) ?? null;
  }

  async existsActiveBetween(a: UserId, b: UserId): Promise<boolean> {
    return this.items.some(
      (f) =>
        (f.status === 'pending' || f.status === 'accepted') &&
        ((f.requesterId === a && f.addresseeId === b) ||
          (f.requesterId === b && f.addresseeId === a)),
    );
  }
}

class SequentialIdGenerator implements IdGenerator {
  private count = 0;

  generate(): string {
    this.count += 1;
    return `frn_${this.count}`;
  }
}

const NOW = Timestamp.fromISOString('2026-06-01T09:00:00.000Z');
const clock: Clock = { now: () => NOW };

let friendships: InMemoryFriendshipRepository;
let requestFriendship: RequestFriendship;

beforeEach(() => {
  friendships = new InMemoryFriendshipRepository();
  requestFriendship = new RequestFriendship(friendships, new SequentialIdGenerator(), clock);
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
