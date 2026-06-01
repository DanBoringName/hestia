import { DomainError } from '../shared/domain-error.js';

export const HANDLE_MIN_LENGTH = 3;
export const HANDLE_MAX_LENGTH = 30;

// Canonical handle: starts with a letter, then letters / digits / underscores.
// Lower-cased so uniqueness and mentions are case-insensitive. The human-facing
// name lives separately on the User as `displayName`; this is the URL-safe
// identifier used in routes and @-mentions.
const HANDLE_PATTERN = new RegExp(
  `^[a-z][a-z0-9_]{${HANDLE_MIN_LENGTH - 1},${HANDLE_MAX_LENGTH - 1}}$`,
);

export class InvalidHandleError extends DomainError {
  readonly code = 'INVALID_HANDLE';
  readonly category = 'validation' as const;

  constructor(reason: string) {
    super(`Invalid handle: ${reason}.`);
  }
}

/**
 * A unique username. Construct via {@link Handle.create}; the constructor is
 * private so an instance is always valid. Input is trimmed and lower-cased to
 * a canonical form, then required to start with a letter and contain only
 * letters, digits, and underscores.
 */
export class Handle {
  private constructor(readonly value: string) {}

  static create(raw: string): Handle {
    const normalized = raw.trim().toLowerCase();

    if (normalized.length === 0) {
      throw new InvalidHandleError('value is empty');
    }
    if (normalized.length < HANDLE_MIN_LENGTH || normalized.length > HANDLE_MAX_LENGTH) {
      throw new InvalidHandleError(
        `must be ${HANDLE_MIN_LENGTH}-${HANDLE_MAX_LENGTH} characters`,
      );
    }
    if (!HANDLE_PATTERN.test(normalized)) {
      throw new InvalidHandleError(
        'must start with a letter and use only letters, digits, and underscores',
      );
    }

    return new Handle(normalized);
  }

  equals(other: Handle): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
