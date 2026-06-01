import { DisplayName, DomainError, Email, Handle, User, UserId } from '@hestia/domain';
import type { IdGenerator } from '../ports/id-generator.js';
import type { UserRepository } from './user-repository.js';

export class EmailTakenError extends DomainError {
  readonly code = 'EMAIL_TAKEN';
  readonly category = 'conflict' as const;

  // The address is omitted from the message on purpose: revealing whether an
  // email is registered enables account enumeration. The boundary decides what,
  // if anything, to tell the client.
  constructor() {
    super('That email address is already registered.');
  }
}

export class HandleTakenError extends DomainError {
  readonly code = 'HANDLE_TAKEN';
  readonly category = 'conflict' as const;

  constructor(handle: string) {
    super(`The handle "@${handle}" is already taken.`);
  }
}

export interface RegisterUserInput {
  readonly email: string;
  readonly handle: string;
  readonly displayName: string;
}

/**
 * Registers a new account: validates and normalizes the input through the
 * domain value objects, enforces handle/email uniqueness, then creates and
 * persists the {@link User}. Credentials are handled separately by the auth
 * adapter — this use case owns only the profile identity.
 */
export class RegisterUser {
  constructor(
    private readonly users: UserRepository,
    private readonly ids: IdGenerator,
  ) {}

  async execute(input: RegisterUserInput): Promise<User> {
    const email = Email.create(input.email);
    const handle = Handle.create(input.handle);
    const displayName = DisplayName.create(input.displayName);

    if (await this.users.existsByEmail(email)) {
      throw new EmailTakenError();
    }
    if (await this.users.existsByHandle(handle)) {
      throw new HandleTakenError(handle.value);
    }

    const user = User.register({
      id: UserId(this.ids.generate()),
      email,
      handle,
      displayName,
    });
    await this.users.save(user);

    return user;
  }
}
