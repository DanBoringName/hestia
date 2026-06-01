import { Block, BlockId, UserId } from '@hestia/domain';
import type { Clock } from '../ports/clock.js';
import type { IdGenerator } from '../ports/id-generator.js';
import type { BlockRepository } from './block-repository.js';

export interface BlockUserInput {
  readonly blockerId: string;
  readonly blockedId: string;
}

/**
 * Ensures one user blocks another. Idempotent: a block is a desired end-state,
 * not a transaction, so re-blocking an already-blocked user succeeds as a no-op.
 * Self-blocks are rejected by the domain. The check is directional — blocking
 * does not require, and is independent of, a block in the other direction.
 */
export class BlockUser {
  constructor(
    private readonly blocks: BlockRepository,
    private readonly ids: IdGenerator,
    private readonly clock: Clock,
  ) {}

  async execute(input: BlockUserInput): Promise<void> {
    const blockerId = UserId(input.blockerId);
    const blockedId = UserId(input.blockedId);

    if (await this.blocks.existsByBlockerAndBlocked(blockerId, blockedId)) {
      return;
    }

    const block = Block.place({
      id: BlockId(this.ids.generate()),
      blockerId,
      blockedId,
      blockedAt: this.clock.now(),
    });
    await this.blocks.save(block);
  }
}
