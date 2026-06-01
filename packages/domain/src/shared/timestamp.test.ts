import { describe, expect, it } from 'vitest';
import { InvalidTimestampError, Timestamp } from './timestamp.js';

describe('Timestamp.fromEpochMillis', () => {
  it('stores the epoch milliseconds', () => {
    expect(Timestamp.fromEpochMillis(1_700_000_000_000).epochMillis).toBe(1_700_000_000_000);
  });

  it('accepts the epoch and instants before it', () => {
    expect(Timestamp.fromEpochMillis(0).toISOString()).toBe('1970-01-01T00:00:00.000Z');
    expect(Timestamp.fromEpochMillis(-1000).epochMillis).toBe(-1000);
  });

  it.each([1.5, Number.NaN, Number.POSITIVE_INFINITY])(
    'rejects the non-integer value %j',
    (bad) => {
      expect(() => Timestamp.fromEpochMillis(bad)).toThrow(InvalidTimestampError);
    },
  );
});

describe('Timestamp.fromISOString', () => {
  it('parses an ISO 8601 instant', () => {
    expect(Timestamp.fromISOString('1970-01-01T00:00:00.000Z').epochMillis).toBe(0);
  });

  it('round-trips through toISOString in canonical UTC form', () => {
    const iso = '2026-06-01T12:30:00.000Z';

    expect(Timestamp.fromISOString(iso).toISOString()).toBe(iso);
  });

  it('rejects an unparseable value', () => {
    expect(() => Timestamp.fromISOString('not-a-date')).toThrow(InvalidTimestampError);
  });
});

describe('Timestamp comparison', () => {
  const earlier = Timestamp.fromEpochMillis(1000);
  const later = Timestamp.fromEpochMillis(2000);

  it('orders instants', () => {
    expect(earlier.isBefore(later)).toBe(true);
    expect(later.isAfter(earlier)).toBe(true);
    expect(earlier.isAfter(later)).toBe(false);
  });

  it('compares equality by instant', () => {
    expect(earlier.equals(Timestamp.fromEpochMillis(1000))).toBe(true);
    expect(earlier.equals(later)).toBe(false);
  });

  it('renders ISO via toString', () => {
    expect(String(Timestamp.fromEpochMillis(0))).toBe('1970-01-01T00:00:00.000Z');
  });
});

describe('InvalidTimestampError', () => {
  it('carries a validation code and category', () => {
    const error = new InvalidTimestampError('epoch milliseconds must be an integer');

    expect(error.code).toBe('INVALID_TIMESTAMP');
    expect(error.category).toBe('validation');
  });
});
