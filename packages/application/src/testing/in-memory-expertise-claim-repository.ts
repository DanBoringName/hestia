import type { ExpertiseClaim, ExpertiseClaimId, ExpertiseTag, UserId } from '@hestia/domain';
import type { ExpertiseClaimRepository } from '../identity/expertise-claim-repository.js';

/** In-memory {@link ExpertiseClaimRepository} for use-case tests. */
export class InMemoryExpertiseClaimRepository implements ExpertiseClaimRepository {
  readonly items: ExpertiseClaim[] = [];

  save(claim: ExpertiseClaim): Promise<void> {
    const index = this.items.findIndex((item) => item.id === claim.id);
    if (index >= 0) {
      this.items[index] = claim;
    } else {
      this.items.push(claim);
    }
    return Promise.resolve();
  }

  findById(id: ExpertiseClaimId): Promise<ExpertiseClaim | null> {
    return Promise.resolve(this.items.find((item) => item.id === id) ?? null);
  }

  existsByUserAndTag(userId: UserId, tag: ExpertiseTag): Promise<boolean> {
    return Promise.resolve(
      this.items.some((item) => item.userId === userId && item.tag.equals(tag)),
    );
  }
}
