import type { Timestamp } from '@hestia/domain';
import type { Clock } from '../ports/clock.js';

/** A {@link Clock} frozen at a single instant. */
export function fixedClock(at: Timestamp): Clock {
  return { now: () => at };
}
