import { UserId } from '@hestia/domain';
import type { BlockRepository } from './block-repository.js';

export interface UnblockUserInput {
  readonly blockerId: string;
  readonly blockedId: string;
}

/**
 * Lifts a block. Idempotent and directional: removing the blocker→blocked
 * relationship succeeds whether or not it existed, and never touches a block in
 * the other direction. Unblocking is a delete, so there is no domain entity or
 * timestamp involved.
 */
export class UnblockUser {
  constructor(private readonly blocks: BlockRepository) {}

  async execute(input: UnblockUserInput): Promise<void> {
    const blockerId = UserId(input.blockerId);
    const blockedId = UserId(input.blockedId);

    await this.blocks.removeByBlockerAndBlocked(blockerId, blockedId);
  }
}
