import { Timestamp } from '@hestia/domain';
import { describe, expect, it } from 'vitest';
import type { Clock } from './clock.js';

describe('Clock port', () => {
  it('can be implemented to return a domain Timestamp', () => {
    const fixed = Timestamp.fromISOString('2026-06-01T00:00:00.000Z');
    const clock: Clock = { now: () => fixed };

    expect(clock.now().equals(fixed)).toBe(true);
  });
});
