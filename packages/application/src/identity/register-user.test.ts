import { Email, Handle, InvalidEmailError, User } from '@hestia/domain';
import { beforeEach, describe, expect, it } from 'vitest';
import type { IdGenerator } from '../ports/id-generator.js';
import { EmailTakenError, HandleTakenError, RegisterUser } from './register-user.js';
import type { UserRepository } from './user-repository.js';

class InMemoryUserRepository implements UserRepository {
  private readonly users: User[] = [];

  async save(user: User): Promise<void> {
    this.users.push(user);
  }

  async existsByHandle(handle: Handle): Promise<boolean> {
    return this.users.some((user) => user.handle.equals(handle));
  }

  async existsByEmail(email: Email): Promise<boolean> {
    return this.users.some((user) => user.email.equals(email));
  }
}

class SequentialIdGenerator implements IdGenerator {
  private count = 0;

  generate(): string {
    this.count += 1;
    return `usr_${this.count}`;
  }
}

const validInput = {
  email: 'ada@example.com',
  handle: 'ada',
  displayName: 'Ada Lovelace',
};

let users: InMemoryUserRepository;
let ids: SequentialIdGenerator;
let registerUser: RegisterUser;

beforeEach(() => {
  users = new InMemoryUserRepository();
  ids = new SequentialIdGenerator();
  registerUser = new RegisterUser(users, ids);
});

describe('RegisterUser', () => {
  it('registers, normalizes, persists, and returns the user', async () => {
    const user = await registerUser.execute({
      email: '  Ada@Example.com ',
      handle: 'Ada',
      displayName: '  Ada Lovelace ',
    });

    expect(user.id).toBe('usr_1');
    expect(user.email.value).toBe('ada@example.com');
    expect(user.handle.value).toBe('ada');
    expect(user.displayName.value).toBe('Ada Lovelace');
    expect(await users.existsByEmail(Email.create('ada@example.com'))).toBe(true);
  });

  it('rejects a duplicate email case-insensitively, without revealing the address', async () => {
    await registerUser.execute(validInput);

    await expect(
      registerUser.execute({ ...validInput, email: 'ADA@example.com', handle: 'ada2' }),
    ).rejects.toBeInstanceOf(EmailTakenError);
  });

  it('rejects a duplicate handle case-insensitively', async () => {
    await registerUser.execute(validInput);

    await expect(
      registerUser.execute({ ...validInput, email: 'other@example.com', handle: 'ADA' }),
    ).rejects.toBeInstanceOf(HandleTakenError);
  });

  it('validates input before any persistence', async () => {
    await expect(
      registerUser.execute({ ...validInput, email: 'not-an-email' }),
    ).rejects.toBeInstanceOf(InvalidEmailError);
    await expect(users.existsByEmail(Email.create('ada@example.com'))).resolves.toBe(false);
  });

  it('exposes registration conflicts as DomainErrors in the conflict category', () => {
    expect(new EmailTakenError().category).toBe('conflict');
    expect(new HandleTakenError('ada').category).toBe('conflict');
    expect(new EmailTakenError().code).toBe('EMAIL_TAKEN');
    expect(new HandleTakenError('ada').code).toBe('HANDLE_TAKEN');
  });
});
