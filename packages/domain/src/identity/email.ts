import { DomainError } from '../shared/domain-error.js';
import { StringValueObject } from '../shared/value-object.js';

// Pragmatic, deliberately non-exhaustive shape check: one `@`, non-empty local
// and domain parts, a dotted domain, and no whitespace. Full RFC 5322 validation
// belongs to the delivery layer (a verification email either arrives or it does
// not) — the domain only guards against obviously malformed input.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// RFC 5321 caps an address at 254 characters.
const MAX_EMAIL_LENGTH = 254;

export class InvalidEmailError extends DomainError {
  readonly code = 'INVALID_EMAIL';
  readonly category = 'validation' as const;

  constructor(reason: string) {
    super(`Invalid email: ${reason}.`);
  }
}

/**
 * An email address, normalized to a trimmed, lower-cased canonical form so that
 * equality and uniqueness are case-insensitive. Construct via {@link Email.create},
 * which validates and normalizes; instances are always valid.
 */
export class Email extends StringValueObject {
  static create(raw: string): Email {
    const normalized = raw.trim().toLowerCase();

    if (normalized.length === 0) {
      throw new InvalidEmailError('value is empty');
    }
    if (normalized.length > MAX_EMAIL_LENGTH) {
      throw new InvalidEmailError(`exceeds ${MAX_EMAIL_LENGTH} characters`);
    }
    if (!EMAIL_PATTERN.test(normalized)) {
      throw new InvalidEmailError('not a well-formed address');
    }

    return new Email(normalized);
  }

  /**
   * The domain part after the `@`, e.g. `cam.ac.uk`. Drives email-domain
   * expertise verification, which maps institutional domains to credentials.
   */
  get domain(): string {
    return this.value.slice(this.value.lastIndexOf('@') + 1);
  }
}
