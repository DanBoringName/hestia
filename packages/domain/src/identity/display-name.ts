import { DomainError } from '../shared/domain-error.js';
import { StringValueObject } from '../shared/value-object.js';

export const DISPLAY_NAME_MAX_LENGTH = 50;

export class InvalidDisplayNameError extends DomainError {
  readonly code = 'INVALID_DISPLAY_NAME';
  readonly category = 'validation' as const;

  constructor(reason: string) {
    super(`Invalid display name: ${reason}.`);
  }
}

/**
 * A user's freeform, human-facing name — distinct from the lower-cased,
 * URL-safe {@link Handle}. Case and spacing are preserved; only surrounding
 * whitespace is trimmed. Control characters are rejected so a name can never
 * break layout or screen-reader output.
 */
export class DisplayName extends StringValueObject {
  static create(raw: string): DisplayName {
    const trimmed = raw.trim();

    if (trimmed.length === 0) {
      throw new InvalidDisplayNameError('value is empty');
    }
    if (trimmed.length > DISPLAY_NAME_MAX_LENGTH) {
      throw new InvalidDisplayNameError(`exceeds ${DISPLAY_NAME_MAX_LENGTH} characters`);
    }
    if (hasControlCharacter(trimmed)) {
      throw new InvalidDisplayNameError('contains control characters');
    }

    return new DisplayName(trimmed);
  }
}

function hasControlCharacter(value: string): boolean {
  return [...value].some((char) => {
    const code = char.codePointAt(0) ?? 0;
    return code < 0x20 || code === 0x7f;
  });
}
