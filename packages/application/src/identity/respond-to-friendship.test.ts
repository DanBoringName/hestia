import {
  Friendship,
  FriendshipActorError,
  FriendshipId,
  IllegalFriendshipTransitionError,
  InvalidIdentifierError,
  Timestamp,
  UserId,
} from '@hestia/domain';
import { beforeEach, describe, expect, it } from 'vitest';
import { fixedClock, InMemoryFriendshipRepository } from '../testing/index.js';
import { FriendshipNotFoundError, RespondToFriendship } from './respond-to-friendship.js';

const REQUESTER = UserId('usr_requester');
const ADDRESSEE = UserId('usr_addressee');
const REQUESTED_AT = Timestamp.fromISOString('2026-06-01T09:00:00.000Z');
const RESPONDED_AT = Timestamp.fromISOString('2026-06-01T10:00:00.000Z');

let friendships: InMemoryFriendshipRepository;
let respondToFriendship: RespondToFriendship;

function seedPending(): void {
  friendships.items.push(
    Friendship.request({
      id: FriendshipId('frn_1'),
      requesterId: REQUESTER,
      addresseeId: ADDRESSEE,
      requestedAt: REQUESTED_AT,
    }),
  );
}

beforeEach(() => {
  friendships = new InMemoryFriendshipRepository();
  respondToFriendship = new RespondToFriendship(friendships, fixedClock(RESPONDED_AT));
});

describe('RespondToFriendship', () => {
  it('lets the addressee accept, stamping the response time and persisting', async () => {
    seedPending();

    const friendship = await respondToFriendship.execute({
      friendshipId: 'frn_1',
      actorId: 'usr_addressee',
      response: 'accept',
    });

    expect(friendship.status).toBe('accepted');
    expect(friendship.respondedAt?.equals(RESPONDED_AT)).toBe(true);
    const stored = await friendships.findById(FriendshipId('frn_1'));
    expect(stored?.status).toBe('accepted');
  });

  it('lets the addressee decline', async () => {
    seedPending();

    const friendship = await respondToFriendship.execute({
      friendshipId: 'frn_1',
      actorId: 'usr_addressee',
      response: 'decline',
    });

    expect(friendship.status).toBe('declined');
  });

  it('throws when the friendship does not exist', async () => {
    await expect(
      respondToFriendship.execute({
        friendshipId: 'frn_missing',
        actorId: 'usr_addressee',
        response: 'accept',
      }),
    ).rejects.toBeInstanceOf(FriendshipNotFoundError);
  });

  it('lets the domain reject a non-addressee responder', async () => {
    seedPending();

    await expect(
      respondToFriendship.execute({
        friendshipId: 'frn_1',
        actorId: 'usr_requester',
        response: 'accept',
      }),
    ).rejects.toBeInstanceOf(FriendshipActorError);
  });

  it('lets the domain reject answering a non-pending request', async () => {
    seedPending();
    await respondToFriendship.execute({
      friendshipId: 'frn_1',
      actorId: 'usr_addressee',
      response: 'accept',
    });

    await expect(
      respondToFriendship.execute({
        friendshipId: 'frn_1',
        actorId: 'usr_addressee',
        response: 'decline',
      }),
    ).rejects.toBeInstanceOf(IllegalFriendshipTransitionError);
  });

  it('rejects a malformed id', async () => {
    await expect(
      respondToFriendship.execute({ friendshipId: '', actorId: 'usr_addressee', response: 'accept' }),
    ).rejects.toBeInstanceOf(InvalidIdentifierError);
  });

  it('exposes the not-found error as a DomainError', () => {
    expect(new FriendshipNotFoundError().code).toBe('FRIENDSHIP_NOT_FOUND');
    expect(new FriendshipNotFoundError().category).toBe('not-found');
  });
});
