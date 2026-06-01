export { DomainError, isDomainError } from './shared/domain-error.js';
export type { DomainErrorCategory } from './shared/domain-error.js';
export { defineIdentifier, InvalidIdentifierError } from './shared/identifier.js';
export type { Identifier } from './shared/identifier.js';
export { Email, InvalidEmailError } from './identity/email.js';
export {
  Handle,
  HANDLE_MAX_LENGTH,
  HANDLE_MIN_LENGTH,
  InvalidHandleError,
} from './identity/handle.js';
