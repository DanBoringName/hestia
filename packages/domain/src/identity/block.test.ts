import { describe, expect, it } from 'vitest';
import { Timestamp } from '../shared/timestamp.js';
import { Block, BlockId, CannotBlockSelfError, type PlaceBlockProps } from './block.js';
import { UserId } from './user.js';

const BLOCKER = UserId('usr_blocker');
const BLOCKED = UserId('usr_blocked');
const OUTSIDER = UserId('usr_outsider');
const BLOCKED_AT = Timestamp.fromISOString('2026-06-01T09:00:00.000Z');

function place(overrides: Partial<PlaceBlockProps> = {}): Block {
  return Block.place({
    id: BlockId('blk_1'),
    blockerId: BLOCKER,
    blockedId: BLOCKED,
    blockedAt: BLOCKED_AT,
    ...overrides,
  });
}

describe('Block.place', () => {
  it('records the directional relationship and time', () => {
    const block = place();

    expect(block.id).toBe('blk_1');
    expect(block.blockerId).toBe(BLOCKER);
    expect(block.blockedId).toBe(BLOCKED);
    expect(block.blockedAt.equals(BLOCKED_AT)).toBe(true);
  });

  it('refuses a self-block', () => {
    expect(() => place({ blockedId: BLOCKER })).toThrow(CannotBlockSelfError);
  });
});

describe('Block.involves', () => {
  it('is true for either party and false for an outsider', () => {
    const block = place();

    expect(block.involves(BLOCKER)).toBe(true);
    expect(block.involves(BLOCKED)).toBe(true);
    expect(block.involves(OUTSIDER)).toBe(false);
  });
});

describe('Block equality', () => {
  it('is identity-based', () => {
    const a = place({ id: BlockId('blk_a') });
    const b = place({ id: BlockId('blk_b') });

    expect(a.equals(place({ id: BlockId('blk_a') }))).toBe(true);
    expect(a.equals(b)).toBe(false);
  });
});

describe('CannotBlockSelfError', () => {
  it('carries a validation code and category', () => {
    const error = new CannotBlockSelfError();

    expect(error.code).toBe('CANNOT_BLOCK_SELF');
    expect(error.category).toBe('validation');
  });
});
