import { describe, expect, it } from 'vitest';
import { Timestamp } from '../shared/timestamp.js';
import {
  ClaimExpertiseProps,
  ExpertiseClaim,
  ExpertiseClaimId,
  IllegalVerificationError,
} from './expertise-claim.js';
import { ExpertiseTag } from './expertise-tag.js';
import { ExpertiseVerification } from './expertise-verification.js';
import { UserId } from './user.js';

const CLAIMED_AT = Timestamp.fromISOString('2026-06-01T09:00:00.000Z');
const VERIFIED_AT = Timestamp.fromISOString('2026-06-02T10:00:00.000Z');

function sampleProps(overrides: Partial<ClaimExpertiseProps> = {}): ClaimExpertiseProps {
  return {
    id: ExpertiseClaimId('xpc_1'),
    userId: UserId('usr_ada'),
    tag: ExpertiseTag.create('marine-biology'),
    claimedAt: CLAIMED_AT,
    ...overrides,
  };
}

const emailDomain = ExpertiseVerification.byEmailDomain({
  institution: 'NIH',
  emailDomain: 'nih.gov',
});

describe('ExpertiseClaim.claim', () => {
  it('starts self-asserted and unverified', () => {
    const claim = ExpertiseClaim.claim(sampleProps());

    expect(claim.id).toBe('xpc_1');
    expect(claim.userId).toBe('usr_ada');
    expect(claim.tag.value).toBe('marine-biology');
    expect(claim.isVerified).toBe(false);
    expect(claim.verification.method).toBe('unverified');
    expect(claim.claimedAt.equals(CLAIMED_AT)).toBe(true);
    expect(claim.verifiedAt).toBeUndefined();
  });
});

describe('ExpertiseClaim.verify', () => {
  it('applies a verification and stamps verifiedAt, leaving the original intact', () => {
    const claim = ExpertiseClaim.claim(sampleProps());
    const verified = claim.verify(emailDomain, VERIFIED_AT);

    expect(verified.isVerified).toBe(true);
    expect(verified.verification.equals(emailDomain)).toBe(true);
    expect(verified.verifiedAt?.equals(VERIFIED_AT)).toBe(true);
    expect(verified).not.toBe(claim);
    expect(claim.isVerified).toBe(false);
  });

  it('replaces the prior method when re-verified', () => {
    const manual = ExpertiseVerification.byManualReview({
      reviewerId: UserId('usr_admin'),
      evidenceRef: 'evidence/diploma.pdf',
    });
    const reverifiedAt = Timestamp.fromISOString('2026-06-03T11:00:00.000Z');
    const claim = ExpertiseClaim.claim(sampleProps()).verify(emailDomain, VERIFIED_AT);

    const reverified = claim.verify(manual, reverifiedAt);

    expect(reverified.verification.equals(manual)).toBe(true);
    expect(reverified.verifiedAt?.equals(reverifiedAt)).toBe(true);
  });

  it('refuses an unverified verification', () => {
    const claim = ExpertiseClaim.claim(sampleProps());

    expect(() => claim.verify(ExpertiseVerification.unverified(), VERIFIED_AT)).toThrow(
      IllegalVerificationError,
    );
  });
});

describe('ExpertiseClaim.revokeVerification', () => {
  it('returns the claim to self-asserted and clears verifiedAt', () => {
    const claim = ExpertiseClaim.claim(sampleProps()).verify(emailDomain, VERIFIED_AT);

    const revoked = claim.revokeVerification();

    expect(revoked.isVerified).toBe(false);
    expect(revoked.verification.method).toBe('unverified');
    expect(revoked.verifiedAt).toBeUndefined();
  });

  it('is idempotent on an already-unverified claim', () => {
    const claim = ExpertiseClaim.claim(sampleProps());

    expect(claim.revokeVerification().isVerified).toBe(false);
  });
});

describe('ExpertiseClaim.reconstitute', () => {
  it('rebuilds a verified claim from persisted state', () => {
    const claim = ExpertiseClaim.reconstitute({
      id: ExpertiseClaimId('xpc_1'),
      userId: UserId('usr_ada'),
      tag: ExpertiseTag.create('marine-biology'),
      verification: emailDomain,
      claimedAt: CLAIMED_AT,
      verifiedAt: VERIFIED_AT,
    });

    expect(claim.isVerified).toBe(true);
    expect(claim.verification.equals(emailDomain)).toBe(true);
    expect(claim.verifiedAt?.equals(VERIFIED_AT)).toBe(true);
    expect(claim.revokeVerification().isVerified).toBe(false);
  });
});

describe('ExpertiseClaim equality', () => {
  it('is identity-based: same id is equal despite differing verification', () => {
    const claim = ExpertiseClaim.claim(sampleProps());
    const verified = claim.verify(emailDomain, VERIFIED_AT);

    expect(claim.equals(verified)).toBe(true);
  });

  it('distinguishes different ids', () => {
    const a = ExpertiseClaim.claim(sampleProps({ id: ExpertiseClaimId('xpc_a') }));
    const b = ExpertiseClaim.claim(sampleProps({ id: ExpertiseClaimId('xpc_b') }));

    expect(a.equals(b)).toBe(false);
  });
});

describe('IllegalVerificationError', () => {
  it('carries a validation code and category', () => {
    const error = new IllegalVerificationError('nope');

    expect(error.code).toBe('ILLEGAL_VERIFICATION');
    expect(error.category).toBe('validation');
  });
});
