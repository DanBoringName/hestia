import type { Clock } from '@hestia/application';
import { Timestamp } from '@hestia/domain';

/**
 * Production {@link Clock} backed by the system clock. Reading the current time
 * lives here in the adapter layer — never in the domain — so domain rules stay
 * deterministic and testable.
 */
export class SystemClock implements Clock {
  now(): Timestamp {
    return Timestamp.fromEpochMillis(Date.now());
  }
}
