import { DomainError } from './domain-error.js';

/**
 * Phantom brand marker. Never present at runtime; it exists only so that two
 * identifier types with different brands are incompatible at the type level —
 * a `UserId` can never be passed where a `DebateId` is expected, even though
 * both are strings underneath.
 */
declare const identifierBrand: unique symbol;

export type Identifier<Brand extends string> = string & {
  readonly [identifierBrand]: Brand;
};

export class InvalidIdentifierError extends DomainError {
  readonly code = 'INVALID_IDENTIFIER';
  readonly category = 'validation' as const;

  constructor(brand: string) {
    super(`Invalid ${brand}: expected a non-empty identifier.`);
  }
}

/**
 * Builds a factory for one brand of identifier. Each entity defines its own:
 *
 *   export type UserId = Identifier<'UserId'>;
 *   export const UserId = defineIdentifier('UserId');
 *
 * The returned function validates that the raw value is a non-empty,
 * untrimmed string and brands it. Surrounding whitespace is rejected rather
 * than silently trimmed, so a padded value surfaces as a bug at its source.
 */
export function defineIdentifier<Brand extends string>(
  brand: Brand,
): (value: string) => Identifier<Brand> {
  return (value: string): Identifier<Brand> => {
    if (value.length === 0 || value.trim() !== value) {
      throw new InvalidIdentifierError(brand);
    }
    return value as Identifier<Brand>;
  };
}
