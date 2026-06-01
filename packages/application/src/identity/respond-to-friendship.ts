import { DomainError, Friendship, FriendshipId, UserId } from '@hestia/domain';
import type { Clock } from '../ports/clock.js';
import type { FriendshipRepository } from './friendship-repository.js';

export class FriendshipNotFoundError extends DomainError {
  readonly code = 'FRIENDSHIP_NOT_FOUND';
  readonly category = 'not-found' as const;

  constructor() {
    super('Friendship request not found.');
  }
}

export type FriendshipResponse = 'accept' | 'decline';

export interface RespondToFriendshipInput {
  readonly friendshipId: string;
  readonly actorId: string;
  readonly response: FriendshipResponse;
}

/**
 * Answers a pending friend request. Loads the {@link Friendship}, then accepts
 * or declines it on behalf of the acting user. The domain enforces who may
 * respond (only the addressee) and that the request is still pending; this use
 * case only resolves the entity, stamps the time, and persists the result.
 */
export class RespondToFriendship {
  constructor(
    private readonly friendships: FriendshipRepository,
    private readonly clock: Clock,
  ) {}

  async execute(input: RespondToFriendshipInput): Promise<Friendship> {
    const friendshipId = FriendshipId(input.friendshipId);
    const actorId = UserId(input.actorId);

    const friendship = await this.friendships.findById(friendshipId);
    if (friendship === null) {
      throw new FriendshipNotFoundError();
    }

    const respondedAt = this.clock.now();
    const updated =
      input.response === 'accept'
        ? friendship.accept(actorId, respondedAt)
        : friendship.decline(actorId, respondedAt);

    await this.friendships.save(updated);

    return updated;
  }
}
