import type { Block, UserId } from '@hestia/domain';
import type { BlockRepository } from '../identity/block-repository.js';

/** In-memory {@link BlockRepository} for use-case tests. */
export class InMemoryBlockRepository implements BlockRepository {
  items: Block[] = [];

  save(block: Block): Promise<void> {
    this.items.push(block);
    return Promise.resolve();
  }

  existsByBlockerAndBlocked(blockerId: UserId, blockedId: UserId): Promise<boolean> {
    return Promise.resolve(
      this.items.some((b) => b.blockerId === blockerId && b.blockedId === blockedId),
    );
  }

  removeByBlockerAndBlocked(blockerId: UserId, blockedId: UserId): Promise<void> {
    this.items = this.items.filter(
      (b) => !(b.blockerId === blockerId && b.blockedId === blockedId),
    );
    return Promise.resolve();
  }
}
