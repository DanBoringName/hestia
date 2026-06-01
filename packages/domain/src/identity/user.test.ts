import { describe, expect, it } from 'vitest';
import { DisplayName } from './display-name.js';
import { Email } from './email.js';
import { Handle } from './handle.js';
import { User, UserId, type RegisterUserProps } from './user.js';

function sampleProps(overrides: Partial<RegisterUserProps> = {}): RegisterUserProps {
  return {
    id: UserId('usr_ada'),
    email: Email.create('ada@example.com'),
    handle: Handle.create('ada'),
    displayName: DisplayName.create('Ada Lovelace'),
    ...overrides,
  };
}

describe('User.register', () => {
  it('assembles a user from its value objects', () => {
    const user = User.register(sampleProps());

    expect(user.id).toBe('usr_ada');
    expect(user.email.value).toBe('ada@example.com');
    expect(user.handle.value).toBe('ada');
    expect(user.displayName.value).toBe('Ada Lovelace');
  });
});

describe('User state changes', () => {
  it('returns a new user with the changed email, leaving the original intact', () => {
    const user = User.register(sampleProps());
    const updated = user.changeEmail(Email.create('ada@cam.ac.uk'));

    expect(updated.email.value).toBe('ada@cam.ac.uk');
    expect(updated).not.toBe(user);
    expect(user.email.value).toBe('ada@example.com');
  });

  it('changes the handle without touching identity', () => {
    const user = User.register(sampleProps());
    const updated = user.changeHandle(Handle.create('countess'));

    expect(updated.handle.value).toBe('countess');
    expect(updated.id).toBe(user.id);
  });

  it('renames the display name', () => {
    const user = User.register(sampleProps());
    const updated = user.rename(DisplayName.create('A. Lovelace'));

    expect(updated.displayName.value).toBe('A. Lovelace');
  });
});

describe('User equality', () => {
  it('is identity-based: same id is equal despite differing attributes', () => {
    const user = User.register(sampleProps());
    const renamedSameId = user.rename(DisplayName.create('Augusta Ada King'));

    expect(user.equals(renamedSameId)).toBe(true);
  });

  it('distinguishes different ids even with identical attributes', () => {
    const a = User.register(sampleProps({ id: UserId('usr_a') }));
    const b = User.register(sampleProps({ id: UserId('usr_b') }));

    expect(a.equals(b)).toBe(false);
  });
});
