import { DomainError, Friendship, FriendshipId, UserId } from '@hestia/domain';
import type { Clock } from '../ports/clock.js';
import type { IdGenerator } from '../ports/id-generator.js';
import type { FriendshipRepository } from './friendship-repository.js';

export class DuplicateFriendshipError extends DomainError {
  readonly code = 'DUPLICATE_FRIENDSHIP';
  readonly category = 'conflict' as const;

  constructor() {
    super('These users already have a pending or active friendship.');
  }
}

export interface RequestFriendshipInput {
  readonly requesterId: string;
  readonly addresseeId: string;
}

/**
 * Sends a friend request, creating a pending {@link Friendship}. Rejects a
 * request that would duplicate a live one; self-requests are rejected by the
 * domain. The addressee's existence is not checked here — it is enforced by the
 * persistence layer's foreign key; an explicit check can be added if a use case
 * needs to distinguish that case.
 */
export class RequestFriendship {
  constructor(
    private readonly friendships: FriendshipRepository,
    private readonly ids: IdGenerator,
    private readonly clock: Clock,
  ) {}

  async execute(input: RequestFriendshipInput): Promise<Friendship> {
    const requesterId = UserId(input.requesterId);
    const addresseeId = UserId(input.addresseeId);

    if (await this.friendships.existsActiveBetween(requesterId, addresseeId)) {
      throw new DuplicateFriendshipError();
    }

    const friendship = Friendship.request({
      id: FriendshipId(this.ids.generate()),
      requesterId,
      addresseeId,
      requestedAt: this.clock.now(),
    });
    await this.friendships.save(friendship);

    return friendship;
  }
}
