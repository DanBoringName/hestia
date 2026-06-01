import type { Friendship, FriendshipId, UserId } from '@hestia/domain';
import type { FriendshipRepository } from '../identity/friendship-repository.js';

/** In-memory {@link FriendshipRepository} for use-case tests. */
export class InMemoryFriendshipRepository implements FriendshipRepository {
  readonly items: Friendship[] = [];

  save(friendship: Friendship): Promise<void> {
    const index = this.items.findIndex((item) => item.id === friendship.id);
    if (index >= 0) {
      this.items[index] = friendship;
    } else {
      this.items.push(friendship);
    }
    return Promise.resolve();
  }

  findById(id: FriendshipId): Promise<Friendship | null> {
    return Promise.resolve(this.items.find((item) => item.id === id) ?? null);
  }

  existsActiveBetween(a: UserId, b: UserId): Promise<boolean> {
    return Promise.resolve(
      this.items.some(
        (f) =>
          (f.status === 'pending' || f.status === 'accepted') &&
          ((f.requesterId === a && f.addresseeId === b) ||
            (f.requesterId === b && f.addresseeId === a)),
      ),
    );
  }
}
