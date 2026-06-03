import { DomainError } from '../shared/domain-error.js';
import { Entity } from '../shared/entity.js';
import { defineIdentifier, type Identifier } from '../shared/identifier.js';
import type { Timestamp } from '../shared/timestamp.js';
import type { UserId } from './user.js';

export type FriendshipId = Identifier<'FriendshipId'>;
export const FriendshipId = defineIdentifier('FriendshipId');

export type FriendshipStatus = 'pending' | 'accepted' | 'declined' | 'ended';

export class CannotBefriendSelfError extends DomainError {
  readonly code = 'CANNOT_BEFRIEND_SELF';
  readonly category = 'validation' as const;

  constructor() {
    super('A user cannot send a friend request to themselves.');
  }
}

export class IllegalFriendshipTransitionError extends DomainError {
  readonly code = 'ILLEGAL_FRIENDSHIP_TRANSITION';
  readonly category = 'conflict' as const;
}

export class FriendshipActorError extends DomainError {
  readonly code = 'FRIENDSHIP_ACTOR_NOT_PERMITTED';
  readonly category = 'forbidden' as const;
}

export interface RequestFriendshipProps {
  readonly id: FriendshipId;
  readonly requesterId: UserId;
  readonly addresseeId: UserId;
  readonly requestedAt: Timestamp;
}

export interface FriendshipState {
  readonly id: FriendshipId;
  readonly requesterId: UserId;
  readonly addresseeId: UserId;
  readonly status: FriendshipStatus;
  readonly requestedAt: Timestamp;
  readonly respondedAt: Timestamp | undefined;
  readonly endedAt: Timestamp | undefined;
}

/**
 * A mutual (both-parties-accept) friendship, modeled as a state machine:
 * `pending → accepted | declined`, and `accepted → ended` (unfriend).
 * `declined` and `ended` are terminal — re-befriending starts a new request.
 *
 * Transitions enforce both the current status and who may act: only the
 * addressee answers a request; either participant may unfriend. State changes
 * return a new instance; equality is identity-based.
 */
export class Friendship extends Entity<FriendshipId> {
  private constructor(
    id: FriendshipId,
    readonly requesterId: UserId,
    readonly addresseeId: UserId,
    readonly status: FriendshipStatus,
    readonly requestedAt: Timestamp,
    readonly respondedAt: Timestamp | undefined,
    readonly endedAt: Timestamp | undefined,
  ) {
    super(id);
  }

  static request(props: RequestFriendshipProps): Friendship {
    if (props.requesterId === props.addresseeId) {
      throw new CannotBefriendSelfError();
    }

    return new Friendship(
      props.id,
      props.requesterId,
      props.addresseeId,
      'pending',
      props.requestedAt,
      undefined,
      undefined,
    );
  }

  /**
   * Rebuilds a friendship from persisted state, bypassing transition rules.
   * For repository use only — the stored state is already valid.
   */
  static reconstitute(state: FriendshipState): Friendship {
    return new Friendship(
      state.id,
      state.requesterId,
      state.addresseeId,
      state.status,
      state.requestedAt,
      state.respondedAt,
      state.endedAt,
    );
  }

  get isActive(): boolean {
    return this.status === 'accepted';
  }

  accept(actorId: UserId, at: Timestamp): Friendship {
    this.assertStatus('pending');
    this.assertActor(actorId, [this.addresseeId]);

    return new Friendship(
      this.id,
      this.requesterId,
      this.addresseeId,
      'accepted',
      this.requestedAt,
      at,
      this.endedAt,
    );
  }

  decline(actorId: UserId, at: Timestamp): Friendship {
    this.assertStatus('pending');
    this.assertActor(actorId, [this.addresseeId]);

    return new Friendship(
      this.id,
      this.requesterId,
      this.addresseeId,
      'declined',
      this.requestedAt,
      at,
      this.endedAt,
    );
  }

  unfriend(actorId: UserId, at: Timestamp): Friendship {
    this.assertStatus('accepted');
    this.assertActor(actorId, [this.requesterId, this.addresseeId]);

    return new Friendship(
      this.id,
      this.requesterId,
      this.addresseeId,
      'ended',
      this.requestedAt,
      this.respondedAt,
      at,
    );
  }

  private assertStatus(expected: FriendshipStatus): void {
    if (this.status !== expected) {
      throw new IllegalFriendshipTransitionError(
        `cannot perform this action on a ${this.status} friendship; expected ${expected}`,
      );
    }
  }

  private assertActor(actorId: UserId, permitted: readonly UserId[]): void {
    if (!permitted.includes(actorId)) {
      throw new FriendshipActorError(
        'the acting user is not permitted to perform this action on the friendship',
      );
    }
  }
}
