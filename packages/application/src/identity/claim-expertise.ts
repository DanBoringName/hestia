import { DomainError, ExpertiseClaim, ExpertiseClaimId, ExpertiseTag, UserId } from '@hestia/domain';
import type { Clock } from '../ports/clock.js';
import type { IdGenerator } from '../ports/id-generator.js';
import type { ExpertiseClaimRepository } from './expertise-claim-repository.js';

export class DuplicateExpertiseClaimError extends DomainError {
  readonly code = 'DUPLICATE_EXPERTISE_CLAIM';
  readonly category = 'conflict' as const;

  constructor(tag: string) {
    super(`You have already claimed expertise in "${tag}".`);
  }
}

export interface ClaimExpertiseInput {
  readonly userId: string;
  readonly tag: string;
}

/**
 * Records a self-asserted expertise claim for a user on one topic. The tag is
 * normalized to its canonical slug by the domain, so variant spellings collapse
 * to the same topic. A user holds at most one claim per topic — a duplicate is
 * rejected. Verification is a separate step.
 */
export class ClaimExpertise {
  constructor(
    private readonly claims: ExpertiseClaimRepository,
    private readonly ids: IdGenerator,
    private readonly clock: Clock,
  ) {}

  async execute(input: ClaimExpertiseInput): Promise<ExpertiseClaim> {
    const userId = UserId(input.userId);
    const tag = ExpertiseTag.create(input.tag);

    if (await this.claims.existsByUserAndTag(userId, tag)) {
      throw new DuplicateExpertiseClaimError(tag.value);
    }

    const claim = ExpertiseClaim.claim({
      id: ExpertiseClaimId(this.ids.generate()),
      userId,
      tag,
      claimedAt: this.clock.now(),
    });
    await this.claims.save(claim);

    return claim;
  }
}
