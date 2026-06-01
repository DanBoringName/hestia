import { DomainError } from '../shared/domain-error.js';

export const EXPERTISE_TAG_MIN_LENGTH = 2;
export const EXPERTISE_TAG_MAX_LENGTH = 50;

// Canonical slug: lower-case alphanumeric words joined by single hyphens, e.g.
// `marine-biology`, `tax-law`. v1 is English-only (i18n is out of scope), so
// non-ASCII input is rejected rather than transliterated.
const EXPERTISE_TAG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export class InvalidExpertiseTagError extends DomainError {
  readonly code = 'INVALID_EXPERTISE_TAG';
  readonly category = 'validation' as const;

  constructor(reason: string) {
    super(`Invalid expertise tag: ${reason}.`);
  }
}

/**
 * A freeform topic of expertise, normalized to a slug so that equality and
 * autocomplete are stable regardless of how a user typed it ("Marine Biology",
 * "marine_biology" and "marine-biology" all collapse to `marine-biology`).
 *
 * Used both on a user's {@link ExpertiseClaim} and when a debate is gated by a
 * required expertise topic.
 */
export class ExpertiseTag {
  private constructor(readonly value: string) {}

  static create(raw: string): ExpertiseTag {
    const slug = raw
      .trim()
      .toLowerCase()
      .replace(/[\s_]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');

    if (slug.length === 0) {
      throw new InvalidExpertiseTagError('value is empty');
    }
    if (slug.length < EXPERTISE_TAG_MIN_LENGTH || slug.length > EXPERTISE_TAG_MAX_LENGTH) {
      throw new InvalidExpertiseTagError(
        `must be ${EXPERTISE_TAG_MIN_LENGTH}-${EXPERTISE_TAG_MAX_LENGTH} characters`,
      );
    }
    if (!EXPERTISE_TAG_PATTERN.test(slug)) {
      throw new InvalidExpertiseTagError('must use only letters, digits, and hyphens');
    }

    return new ExpertiseTag(slug);
  }

  equals(other: ExpertiseTag): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
