export { DomainError, isDomainError } from './shared/domain-error.js';
export type { DomainErrorCategory } from './shared/domain-error.js';
export { Entity } from './shared/entity.js';
export { defineIdentifier, InvalidIdentifierError } from './shared/identifier.js';
export type { Identifier } from './shared/identifier.js';
export { InvalidTimestampError, Timestamp } from './shared/timestamp.js';
export { StringValueObject } from './shared/value-object.js';
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
export {
  ExpertiseVerification,
  InvalidVerificationError,
} from './identity/expertise-verification.js';
export type {
  VerificationMatchers,
  VerificationMethod,
} from './identity/expertise-verification.js';
export {
  ExpertiseClaim,
  ExpertiseClaimId,
  IllegalVerificationError,
} from './identity/expertise-claim.js';
export type { ClaimExpertiseProps } from './identity/expertise-claim.js';
export {
  CannotBefriendSelfError,
  Friendship,
  FriendshipActorError,
  FriendshipId,
  IllegalFriendshipTransitionError,
} from './identity/friendship.js';
export type {
  FriendshipStatus,
  RequestFriendshipProps,
} from './identity/friendship.js';
export { Block, BlockId, CannotBlockSelfError } from './identity/block.js';
export type { PlaceBlockProps } from './identity/block.js';
