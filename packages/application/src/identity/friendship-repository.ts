import type { Friendship, FriendshipId, UserId } from '@hestia/domain';

/**
 * Persistence port for {@link Friendship} aggregates.
 *
 * `existsActiveBetween` reports whether the two users are already linked by a
 * non-terminal friendship (pending or accepted), in either direction — it backs
 * the rule that a fresh request can't duplicate a live one. Declined/ended
 * friendships are terminal, so they don't block a new request.
 */
export interface FriendshipRepository {
  save(friendship: Friendship): Promise<void>;
  findById(id: FriendshipId): Promise<Friendship | null>;
  existsActiveBetween(a: UserId, b: UserId): Promise<boolean>;
}
