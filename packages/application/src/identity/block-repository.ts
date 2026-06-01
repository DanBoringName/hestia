import type { Block, UserId } from '@hestia/domain';

/**
 * Persistence port for {@link Block} relationships.
 *
 * Both lookups are directional — "A blocks B" is independent of "B blocks A".
 * `existsByBlockerAndBlocked` backs idempotent placement;
 * `removeByBlockerAndBlocked` backs idempotent unblocking (a no-op when no such
 * block exists), so the caller need not load the block first.
 */
export interface BlockRepository {
  save(block: Block): Promise<void>;
  existsByBlockerAndBlocked(blockerId: UserId, blockedId: UserId): Promise<boolean>;
  removeByBlockerAndBlocked(blockerId: UserId, blockedId: UserId): Promise<void>;
}
