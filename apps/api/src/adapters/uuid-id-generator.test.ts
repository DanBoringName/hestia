import { UserId } from '@hestia/domain';
import { describe, expect, it } from 'vitest';
import { UuidIdGenerator } from './uuid-id-generator.js';

describe('UuidIdGenerator', () => {
  it('generates distinct, brandable id strings', () => {
    const generator = new UuidIdGenerator();

    const a = generator.generate();
    const b = generator.generate();

    expect(a).not.toBe(b);
    expect(a).toMatch(/^[0-9a-f-]{36}$/);
    expect(() => UserId(a)).not.toThrow();
  });
});
