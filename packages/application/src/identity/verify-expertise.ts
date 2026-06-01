import {
  DomainError,
  ExpertiseClaim,
  ExpertiseClaimId,
  ExpertiseVerification,
  UserId,
} from '@hestia/domain';
import type { Clock } from '../ports/clock.js';
import { requireFound } from '../shared/require-found.js';
import type { ExpertiseClaimRepository } from './expertise-claim-repository.js';

export class ExpertiseClaimNotFoundError extends DomainError {
  readonly code = 'EXPERTISE_CLAIM_NOT_FOUND';
  readonly category = 'not-found' as const;

  constructor() {
    super('Expertise claim not found.');
  }
}

export type VerifyExpertiseMethod =
  | { readonly method: 'email-domain'; readonly institution: string; readonly emailDomain: string }
  | { readonly method: 'manual-review'; readonly reviewerId: string; readonly evidenceRef: string };

export interface VerifyExpertiseInput {
  readonly claimId: string;
  readonly verification: VerifyExpertiseMethod;
}

/**
 * Verifies an existing expertise claim by an institutional email domain or by
 * manual review of uploaded evidence. Re-verifying replaces the prior method.
 * The verification's own validity (non-empty institution, evidence, etc.) and
 * the verifiedAt stamp are owned by the domain.
 */
export class VerifyExpertise {
  constructor(
    private readonly claims: ExpertiseClaimRepository,
    private readonly clock: Clock,
  ) {}

  async execute(input: VerifyExpertiseInput): Promise<ExpertiseClaim> {
    const claim = requireFound(
      await this.claims.findById(ExpertiseClaimId(input.claimId)),
      () => new ExpertiseClaimNotFoundError(),
    );

    const verified = claim.verify(toVerification(input.verification), this.clock.now());
    await this.claims.save(verified);

    return verified;
  }
}

function toVerification(input: VerifyExpertiseMethod): ExpertiseVerification {
  switch (input.method) {
    case 'email-domain':
      return ExpertiseVerification.byEmailDomain({
        institution: input.institution,
        emailDomain: input.emailDomain,
      });
    case 'manual-review':
      return ExpertiseVerification.byManualReview({
        reviewerId: UserId(input.reviewerId),
        evidenceRef: input.evidenceRef,
      });
  }
}
