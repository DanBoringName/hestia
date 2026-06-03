import { DomainError } from '../shared/domain-error.js';
import { Entity } from '../shared/entity.js';
import { defineIdentifier, type Identifier } from '../shared/identifier.js';
import type { Timestamp } from '../shared/timestamp.js';
import type { ExpertiseTag } from './expertise-tag.js';
import { ExpertiseVerification } from './expertise-verification.js';
import type { UserId } from './user.js';

export type ExpertiseClaimId = Identifier<'ExpertiseClaimId'>;
export const ExpertiseClaimId = defineIdentifier('ExpertiseClaimId');

export class IllegalVerificationError extends DomainError {
  readonly code = 'ILLEGAL_VERIFICATION';
  readonly category = 'validation' as const;
}

export interface ClaimExpertiseProps {
  readonly id: ExpertiseClaimId;
  readonly userId: UserId;
  readonly tag: ExpertiseTag;
  readonly claimedAt: Timestamp;
}

export interface ExpertiseClaimState {
  readonly id: ExpertiseClaimId;
  readonly userId: UserId;
  readonly tag: ExpertiseTag;
  readonly verification: ExpertiseVerification;
  readonly claimedAt: Timestamp;
  readonly verifiedAt: Timestamp | undefined;
}

/**
 * A user's assertion of expertise in one topic, plus how it has been verified.
 * An entity identified by `id`. Starts self-asserted (unverified) and can be
 * verified or have its verification revoked; state changes return a new
 * instance. `verifiedAt` is present exactly when the claim is verified.
 */
export class ExpertiseClaim extends Entity<ExpertiseClaimId> {
  private constructor(
    id: ExpertiseClaimId,
    readonly userId: UserId,
    readonly tag: ExpertiseTag,
    readonly verification: ExpertiseVerification,
    readonly claimedAt: Timestamp,
    readonly verifiedAt: Timestamp | undefined,
  ) {
    super(id);
  }

  static claim(props: ClaimExpertiseProps): ExpertiseClaim {
    return new ExpertiseClaim(
      props.id,
      props.userId,
      props.tag,
      ExpertiseVerification.unverified(),
      props.claimedAt,
      undefined,
    );
  }

  /**
   * Rebuilds a claim from persisted state, bypassing the verify/revoke rules.
   * For repository use only — the stored state is already valid.
   */
  static reconstitute(state: ExpertiseClaimState): ExpertiseClaim {
    return new ExpertiseClaim(
      state.id,
      state.userId,
      state.tag,
      state.verification,
      state.claimedAt,
      state.verifiedAt,
    );
  }

  get isVerified(): boolean {
    return this.verification.isVerified;
  }

  /**
   * Apply a verification. Re-verifying replaces the prior method. The given
   * verification must itself be verified — clearing verification is
   * {@link revokeVerification}, not `verify(unverified)`.
   */
  verify(verification: ExpertiseVerification, verifiedAt: Timestamp): ExpertiseClaim {
    if (!verification.isVerified) {
      throw new IllegalVerificationError(
        'verify() requires a verified method; use revokeVerification() to clear verification',
      );
    }

    return new ExpertiseClaim(
      this.id,
      this.userId,
      this.tag,
      verification,
      this.claimedAt,
      verifiedAt,
    );
  }

  /** Return the claim to self-asserted. Idempotent. */
  revokeVerification(): ExpertiseClaim {
    return new ExpertiseClaim(
      this.id,
      this.userId,
      this.tag,
      ExpertiseVerification.unverified(),
      this.claimedAt,
      undefined,
    );
  }
}
