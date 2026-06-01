import { DomainError } from './domain-error.js';

export class InvalidTimestampError extends DomainError {
  readonly code = 'INVALID_TIMESTAMP';
  readonly category = 'validation' as const;

  constructor(reason: string) {
    super(`Invalid timestamp: ${reason}.`);
  }
}

/**
 * An instant in time, stored as integer epoch milliseconds (UTC). Immutable,
 * unlike the native `Date`. The domain only ever holds `Timestamp` values; the
 * application-layer `Clock` port is what *produces* "now", so domain rules stay
 * deterministic and testable.
 */
export class Timestamp {
  private constructor(readonly epochMillis: number) {}

  static fromEpochMillis(epochMillis: number): Timestamp {
    if (!Number.isInteger(epochMillis)) {
      throw new InvalidTimestampError('epoch milliseconds must be an integer');
    }
    return new Timestamp(epochMillis);
  }

  static fromISOString(iso: string): Timestamp {
    const epochMillis = Date.parse(iso);
    if (Number.isNaN(epochMillis)) {
      throw new InvalidTimestampError(`unparseable ISO 8601 value "${iso}"`);
    }
    return new Timestamp(epochMillis);
  }

  toISOString(): string {
    // Argument-form `Date` converts a known instant to text deterministically.
    // This is not a current-time read — the prohibited calls are the zero-arg
    // `new Date()` and `Date.now()`.
    return new Date(this.epochMillis).toISOString();
  }

  isBefore(other: Timestamp): boolean {
    return this.epochMillis < other.epochMillis;
  }

  isAfter(other: Timestamp): boolean {
    return this.epochMillis > other.epochMillis;
  }

  equals(other: Timestamp): boolean {
    return this.epochMillis === other.epochMillis;
  }

  toString(): string {
    return this.toISOString();
  }
}
