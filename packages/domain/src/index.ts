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
export {
  DisplayName,
  DISPLAY_NAME_MAX_LENGTH,
  InvalidDisplayNameError,
} from './identity/display-name.js';
export { User, UserId } from './identity/user.js';
export type { RegisterUserProps } from './identity/user.js';
export {
  ExpertiseTag,
  EXPERTISE_TAG_MAX_LENGTH,
  EXPERTISE_TAG_MIN_LENGTH,
  InvalidExpertiseTagError,
} from './identity/expertise-tag.js';
