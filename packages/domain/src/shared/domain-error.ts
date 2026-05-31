export type DomainErrorCategory =
  | 'validation'
  | 'not-found'
  | 'conflict'
  | 'forbidden'
  | 'unauthorized';

/**
 * Base for every typed domain error. Concrete errors extend this and live
 * alongside the entity they concern. `category` is mapped to a transport
 * status at the boundary so the domain never names an HTTP code.
 */
export abstract class DomainError extends Error {
  abstract readonly code: string;
  abstract readonly category: DomainErrorCategory;

  constructor(message: string, options?: { readonly cause?: unknown }) {
    super(message, options);
    this.name = new.target.name;
    // Restore the prototype chain so `instanceof` survives transpilation.
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export function isDomainError(value: unknown): value is DomainError {
  return value instanceof DomainError;
}