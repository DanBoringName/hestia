import { DomainError } from '../shared/domain-error.js';
import { defineIdentifier, type Identifier } from '../shared/identifier.js';
import type { Timestamp } from '../shared/timestamp.js';
import type { UserId } from './user.js';

export type BlockId = Identifier<'BlockId'>;
export const BlockId = defineIdentifier('BlockId');

export class CannotBlockSelfError extends DomainError {
  readonly code = 'CANNOT_BLOCK_SELF';
  readonly category = 'validation' as const;

  constructor() {
    super('A user cannot block themselves.');
  }
}

export interface PlaceBlockProps {
  readonly id: BlockId;
  readonly blockerId: UserId;
  readonly blockedId: UserId;
  readonly blockedAt: Timestamp;
}

/**
 * One user blocking another — a directional relationship from `blockerId` to
 * `blockedId`. An active block prevents debate challenges and hides the blocker
 * from the blocked user's discovery feed. A block is binary: it exists while
 * active, and unblocking removes it (a repository delete), so there is no
 * lifecycle state here.
 */
export class Block {
  private constructor(
    readonly id: BlockId,
    readonly blockerId: UserId,
    readonly blockedId: UserId,
    readonly blockedAt: Timestamp,
  ) {}

  static place(props: PlaceBlockProps): Block {
    if (props.blockerId === props.blockedId) {
      throw new CannotBlockSelfError();
    }

    return new Block(props.id, props.blockerId, props.blockedId, props.blockedAt);
  }

  /** Whether this block concerns the given user, as either party. */
  involves(userId: UserId): boolean {
    return this.blockerId === userId || this.blockedId === userId;
  }

  /** Identity equality: same `id` means the same block, ignoring attributes. */
  equals(other: Block): boolean {
    return this.id === other.id;
  }
}
