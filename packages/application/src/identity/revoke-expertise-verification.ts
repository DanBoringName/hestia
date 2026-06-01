import { ExpertiseClaim, ExpertiseClaimId } from '@hestia/domain';
import type { ExpertiseClaimRepository } from './expertise-claim-repository.js';
import { ExpertiseClaimNotFoundError } from './verify-expertise.js';

export interface RevokeExpertiseVerificationInput {
  readonly claimId: string;
}

/**
 * Clears the verification on an expertise claim, returning it to self-asserted.
 * Idempotent in the domain: revoking an already-unverified claim is a no-op.
 * No clock is needed — revoking clears verifiedAt rather than stamping it.
 */
export class RevokeExpertiseVerification {
  constructor(private readonly claims: ExpertiseClaimRepository) {}

  async execute(input: RevokeExpertiseVerificationInput): Promise<ExpertiseClaim> {
    const claim = await this.claims.findById(ExpertiseClaimId(input.claimId));
    if (claim === null) {
      throw new ExpertiseClaimNotFoundError();
    }

    const revoked = claim.revokeVerification();
    await this.claims.save(revoked);

    return revoked;
  }
}
