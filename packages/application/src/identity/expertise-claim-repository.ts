import type { ExpertiseClaim, ExpertiseClaimId, ExpertiseTag, UserId } from '@hestia/domain';

/**
 * Persistence port for {@link ExpertiseClaim} aggregates.
 *
 * `existsByUserAndTag` backs the rule that a user holds at most one claim per
 * topic — verifying or revoking acts on that single claim rather than creating
 * duplicates. `findById` loads a claim for verification changes.
 */
export interface ExpertiseClaimRepository {
  save(claim: ExpertiseClaim): Promise<void>;
  findById(id: ExpertiseClaimId): Promise<ExpertiseClaim | null>;
  existsByUserAndTag(userId: UserId, tag: ExpertiseTag): Promise<boolean>;
}
