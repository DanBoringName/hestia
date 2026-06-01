import { Block, BlockId, InvalidIdentifierError, Timestamp, UserId } from '@hestia/domain';
import { beforeEach, describe, expect, it } from 'vitest';
import type { BlockRepository } from './block-repository.js';
import { UnblockUser } from './unblock-user.js';

class InMemoryBlockRepository implements BlockRepository {
  items: Block[] = [];

  async save(block: Block): Promise<void> {
    this.items.push(block);
  }

  async existsByBlockerAndBlocked(blockerId: UserId, blockedId: UserId): Promise<boolean> {
    return this.items.some((b) => b.blockerId === blockerId && b.blockedId === blockedId);
  }

  async removeByBlockerAndBlocked(blockerId: UserId, blockedId: UserId): Promise<void> {
    this.items = this.items.filter(
      (b) => !(b.blockerId === blockerId && b.blockedId === blockedId),
    );
  }
}

const NOW = Timestamp.fromISOString('2026-06-01T09:00:00.000Z');

function block(id: string, blockerId: string, blockedId: string): Block {
  return Block.place({
    id: BlockId(id),
    blockerId: UserId(blockerId),
    blockedId: UserId(blockedId),
    blockedAt: NOW,
  });
}

let blocks: InMemoryBlockRepository;
let unblockUser: UnblockUser;

beforeEach(() => {
  blocks = new InMemoryBlockRepository();
  unblockUser = new UnblockUser(blocks);
});

describe('UnblockUser', () => {
  it('removes an existing block', async () => {
    blocks.items.push(block('blk_1', 'usr_a', 'usr_b'));

    await unblockUser.execute({ blockerId: 'usr_a', blockedId: 'usr_b' });

    expect(blocks.items).toHaveLength(0);
  });

  it('is idempotent when no block exists', async () => {
    await expect(
      unblockUser.execute({ blockerId: 'usr_a', blockedId: 'usr_b' }),
    ).resolves.toBeUndefined();
  });

  it('does not touch the reverse-direction block', async () => {
    blocks.items.push(block('blk_1', 'usr_b', 'usr_a'));

    await unblockUser.execute({ blockerId: 'usr_a', blockedId: 'usr_b' });

    expect(blocks.items).toHaveLength(1);
  });

  it('rejects a malformed id', async () => {
    await expect(
      unblockUser.execute({ blockerId: '', blockedId: 'usr_b' }),
    ).rejects.toBeInstanceOf(InvalidIdentifierError);
  });
});
