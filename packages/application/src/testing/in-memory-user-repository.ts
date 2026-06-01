import type { Email, Handle, User } from '@hestia/domain';
import type { UserRepository } from '../identity/user-repository.js';

/** In-memory {@link UserRepository} for use-case tests. */
export class InMemoryUserRepository implements UserRepository {
  readonly items: User[] = [];

  save(user: User): Promise<void> {
    this.items.push(user);
    return Promise.resolve();
  }

  existsByHandle(handle: Handle): Promise<boolean> {
    return Promise.resolve(this.items.some((user) => user.handle.equals(handle)));
  }

  existsByEmail(email: Email): Promise<boolean> {
    return Promise.resolve(this.items.some((user) => user.email.equals(email)));
  }
}
