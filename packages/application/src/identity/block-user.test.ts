import { Block, CannotBlockSelfError, InvalidIdentifierError, Timestamp, UserId } from '@hestia/domain';
import { beforeEach, describe, expect, it } from 'vitest';
import type { Clock } from '../ports/clock.js';
import type { IdGenerator } from '../ports/id-generator.js';
import type { BlockRepository } from './block-repository.js';
import { BlockUser } from './block-user.js';

class InMemoryBlockRepository implements BlockRepository {
  readonly items: Block[] = [];

  async save(block: Block): Promise<void> {
    this.items.push(block);
  }

  async existsByBlockerAndBlocked(blockerId: UserId, blockedId: UserId): Promise<boolean> {
    return this.items.some((b) => b.blockerId === blockerId && b.blockedId === blockedId);
  }
}

class SequentialIdGenerator implements IdGenerator {
  private count = 0;

  generate(): string {
    this.count += 1;
    return `blk_${this.count}`;
  }
}

const NOW = Timestamp.fromISOString('2026-06-01T09:00:00.000Z');
const clock: Clock = { now: () => NOW };

let blocks: InMemoryBlockRepository;
let blockUser: BlockUser;

beforeEach(() => {
  blocks = new InMemoryBlockRepository();
  blockUser = new BlockUser(blocks, new SequentialIdGenerator(), clock);
});

describe('BlockUser', () => {
  it('places a block stamped with the current time', async () => {
    await blockUser.execute({ blockerId: 'usr_a', blockedId: 'usr_b' });

    expect(blocks.items).toHaveLength(1);
    const block = blocks.items[0];
    expect(block?.blockerId).toBe('usr_a');
    expect(block?.blockedId).toBe('usr_b');
    expect(block?.blockedAt.equals(NOW)).toBe(true);
  });

  it('is idempotent: re-blocking is a no-op', async () => {
    await blockUser.execute({ blockerId: 'usr_a', blockedId: 'usr_b' });
    await blockUser.execute({ blockerId: 'usr_a', blockedId: 'usr_b' });

    expect(blocks.items).toHaveLength(1);
  });

  it('treats the reverse direction as a separate block', async () => {
    await blockUser.execute({ blockerId: 'usr_a', blockedId: 'usr_b' });
    await blockUser.execute({ blockerId: 'usr_b', blockedId: 'usr_a' });

    expect(blocks.items).toHaveLength(2);
  });

  it('lets the domain reject a self-block', async () => {
    await expect(
      blockUser.execute({ blockerId: 'usr_a', blockedId: 'usr_a' }),
    ).rejects.toBeInstanceOf(CannotBlockSelfError);
  });

  it('rejects a malformed id', async () => {
    await expect(
      blockUser.execute({ blockerId: 'usr_a', blockedId: '' }),
    ).rejects.toBeInstanceOf(InvalidIdentifierError);
  });
});
