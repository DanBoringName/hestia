import { defineIdentifier, type Identifier } from '../shared/identifier.js';
import type { DisplayName } from './display-name.js';
import type { Email } from './email.js';
import type { Handle } from './handle.js';

export type UserId = Identifier<'UserId'>;
export const UserId = defineIdentifier('UserId');

export interface RegisterUserProps {
  readonly id: UserId;
  readonly email: Email;
  readonly handle: Handle;
  readonly displayName: DisplayName;
}

/**
 * A registered account. An entity: its identity is `id`, so two `User`s with
 * the same id are the same user regardless of their other attributes.
 *
 * Credentials and sessions are deliberately absent — those live in the auth
 * adapter (Better Auth), not the domain. State changes return a new instance
 * rather than mutating in place, keeping the entity easy to reason about and test.
 */
export class User {
  private constructor(
    readonly id: UserId,
    readonly email: Email,
    readonly handle: Handle,
    readonly displayName: DisplayName,
  ) {}

  static register(props: RegisterUserProps): User {
    return new User(props.id, props.email, props.handle, props.displayName);
  }

  changeEmail(email: Email): User {
    return new User(this.id, email, this.handle, this.displayName);
  }

  changeHandle(handle: Handle): User {
    return new User(this.id, this.email, handle, this.displayName);
  }

  rename(displayName: DisplayName): User {
    return new User(this.id, this.email, this.handle, displayName);
  }

  /** Identity equality: same `id` means the same user, ignoring attributes. */
  equals(other: User): boolean {
    return this.id === other.id;
  }
}
