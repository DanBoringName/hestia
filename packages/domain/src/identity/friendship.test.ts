import { describe, expect, it } from 'vitest';
import { Timestamp } from '../shared/timestamp.js';
import {
  CannotBefriendSelfError,
  Friendship,
  FriendshipActorError,
  FriendshipId,
  IllegalFriendshipTransitionError,
  type RequestFriendshipProps,
} from './friendship.js';
import { UserId } from './user.js';

const REQUESTER = UserId('usr_requester');
const ADDRESSEE = UserId('usr_addressee');
const OUTSIDER = UserId('usr_outsider');

const REQUESTED_AT = Timestamp.fromISOString('2026-06-01T09:00:00.000Z');
const RESPONDED_AT = Timestamp.fromISOString('2026-06-01T10:00:00.000Z');
const ENDED_AT = Timestamp.fromISOString('2026-06-02T10:00:00.000Z');

function request(overrides: Partial<RequestFriendshipProps> = {}): Friendship {
  return Friendship.request({
    id: FriendshipId('frn_1'),
    requesterId: REQUESTER,
    addresseeId: ADDRESSEE,
    requestedAt: REQUESTED_AT,
    ...overrides,
  });
}

describe('Friendship.request', () => {
  it('starts pending with no response or end recorded', () => {
    const friendship = request();

    expect(friendship.status).toBe('pending');
    expect(friendship.isActive).toBe(false);
    expect(friendship.requesterId).toBe(REQUESTER);
    expect(friendship.addresseeId).toBe(ADDRESSEE);
    expect(friendship.respondedAt).toBeUndefined();
    expect(friendship.endedAt).toBeUndefined();
  });

  it('refuses a self-request', () => {
    expect(() => request({ addresseeId: REQUESTER })).toThrow(CannotBefriendSelfError);
  });
});

describe('Friendship.accept', () => {
  it('lets the addressee accept, becoming active and stamping respondedAt', () => {
    const pending = request();
    const accepted = pending.accept(ADDRESSEE, RESPONDED_AT);

    expect(accepted.status).toBe('accepted');
    expect(accepted.isActive).toBe(true);
    expect(accepted.respondedAt?.equals(RESPONDED_AT)).toBe(true);
    expect(pending.status).toBe('pending');
  });

  it('forbids the requester (or anyone else) from accepting', () => {
    expect(() => request().accept(REQUESTER, RESPONDED_AT)).toThrow(FriendshipActorError);
    expect(() => request().accept(OUTSIDER, RESPONDED_AT)).toThrow(FriendshipActorError);
  });

  it('cannot accept a friendship that is not pending', () => {
    const accepted = request().accept(ADDRESSEE, RESPONDED_AT);

    expect(() => accepted.accept(ADDRESSEE, RESPONDED_AT)).toThrow(
      IllegalFriendshipTransitionError,
    );
  });
});

describe('Friendship.decline', () => {
  it('lets the addressee decline', () => {
    const declined = request().decline(ADDRESSEE, RESPONDED_AT);

    expect(declined.status).toBe('declined');
    expect(declined.respondedAt?.equals(RESPONDED_AT)).toBe(true);
  });

  it('forbids a non-addressee from declining', () => {
    expect(() => request().decline(REQUESTER, RESPONDED_AT)).toThrow(FriendshipActorError);
  });
});

describe('Friendship.unfriend', () => {
  it('lets either participant end an accepted friendship', () => {
    const accepted = request().accept(ADDRESSEE, RESPONDED_AT);

    const byRequester = accepted.unfriend(REQUESTER, ENDED_AT);
    const byAddressee = accepted.unfriend(ADDRESSEE, ENDED_AT);

    expect(byRequester.status).toBe('ended');
    expect(byRequester.endedAt?.equals(ENDED_AT)).toBe(true);
    expect(byRequester.respondedAt?.equals(RESPONDED_AT)).toBe(true);
    expect(byAddressee.status).toBe('ended');
  });

  it('forbids an outsider from unfriending', () => {
    const accepted = request().accept(ADDRESSEE, RESPONDED_AT);

    expect(() => accepted.unfriend(OUTSIDER, ENDED_AT)).toThrow(FriendshipActorError);
  });

  it('cannot unfriend a friendship that is not accepted', () => {
    expect(() => request().unfriend(REQUESTER, ENDED_AT)).toThrow(
      IllegalFriendshipTransitionError,
    );
  });
});

describe('Friendship.reconstitute', () => {
  it('rebuilds persisted state verbatim and supports further transitions', () => {
    const accepted = Friendship.reconstitute({
      id: FriendshipId('frn_1'),
      requesterId: REQUESTER,
      addresseeId: ADDRESSEE,
      status: 'accepted',
      requestedAt: REQUESTED_AT,
      respondedAt: RESPONDED_AT,
      endedAt: undefined,
    });

    expect(accepted.status).toBe('accepted');
    expect(accepted.isActive).toBe(true);
    expect(accepted.respondedAt?.equals(RESPONDED_AT)).toBe(true);
    expect(accepted.unfriend(REQUESTER, ENDED_AT).status).toBe('ended');
  });
});

describe('Friendship equality', () => {
  it('is identity-based: same id is equal despite differing status', () => {
    const pending = request();
    const accepted = pending.accept(ADDRESSEE, RESPONDED_AT);

    expect(pending.equals(accepted)).toBe(true);
  });

  it('distinguishes different ids', () => {
    const a = request({ id: FriendshipId('frn_a') });
    const b = request({ id: FriendshipId('frn_b') });

    expect(a.equals(b)).toBe(false);
  });
});

describe('Friendship error metadata', () => {
  it('maps each failure to a distinct category', () => {
    expect(new CannotBefriendSelfError().category).toBe('validation');
    expect(new IllegalFriendshipTransitionError('x').category).toBe('conflict');
    expect(new FriendshipActorError('x').category).toBe('forbidden');
  });

  it('exposes stable codes', () => {
    expect(new CannotBefriendSelfError().code).toBe('CANNOT_BEFRIEND_SELF');
    expect(new IllegalFriendshipTransitionError('x').code).toBe(
      'ILLEGAL_FRIENDSHIP_TRANSITION',
    );
    expect(new FriendshipActorError('x').code).toBe('FRIENDSHIP_ACTOR_NOT_PERMITTED');
  });
});
