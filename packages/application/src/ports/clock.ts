import type { Timestamp } from '@hestia/domain';

/**
 * Source of the current instant. The application's only way to read "now" — the
 * domain never touches the system clock, so time-dependent rules stay
 * deterministic and testable. Adapters provide a system-clock implementation;
 * tests provide a fixed one.
 */
export interface Clock {
  now(): Timestamp;
}
