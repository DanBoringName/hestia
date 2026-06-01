import type { Block, UserId } from '@hestia/domain';

/**
 * Persistence port for {@link Block} relationships.
 *
 * `existsByBlockerAndBlocked` is directional — "A blocks B" is independent of
 * "B blocks A" — and backs the rule that placing a block is idempotent rather
 * than duplicated. A removal method will be added alongside the unblock use case.
 */
export interface BlockRepository {
  save(block: Block): Promise<void>;
  existsByBlockerAndBlocked(blockerId: UserId, blockedId: UserId): Promise<boolean>;
}
