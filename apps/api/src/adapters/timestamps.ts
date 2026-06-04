import { Timestamp } from '@hestia/domain';

// Bridges the domain Timestamp and Prisma's `DateTime` (a JS Date). Used by the
// repository adapters; conversion of a known instant is deterministic and is
// not a current-time read.

export function toDate(timestamp: Timestamp): Date {
  return new Date(timestamp.epochMillis);
}

export function toTimestamp(date: Date): Timestamp {
  return Timestamp.fromEpochMillis(date.getTime());
}
