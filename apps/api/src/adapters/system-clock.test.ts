import { Timestamp } from '@hestia/domain';
import { describe, expect, it } from 'vitest';
import { SystemClock } from './system-clock.js';

describe('SystemClock', () => {
  it('returns the current instant as a Timestamp', () => {
    const before = Date.now();
    const now = new SystemClock().now();
    const after = Date.now();

    expect(now).toBeInstanceOf(Timestamp);
    expect(now.epochMillis).toBeGreaterThanOrEqual(before);
    expect(now.epochMillis).toBeLessThanOrEqual(after);
  });
});
