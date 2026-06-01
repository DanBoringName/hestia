import {
  ExpertiseClaim,
  ExpertiseClaimId,
  ExpertiseTag,
  ExpertiseVerification,
  InvalidIdentifierError,
  Timestamp,
  UserId,
} from '@hestia/domain';
import { beforeEach, describe, expect, it } from 'vitest';
import type { ExpertiseClaimRepository } from './expertise-claim-repository.js';
import {
  RevokeExpertiseVerification,
} from './revoke-expertise-verification.js';
import { ExpertiseClaimNotFoundError } from './verify-expertise.js';

class InMemoryExpertiseClaimRepository implements ExpertiseClaimRepository {
  readonly items: ExpertiseClaim[] = [];

  async save(claim: ExpertiseClaim): Promise<void> {
    const index = this.items.findIndex((item) => item.id === claim.id);
    if (index >= 0) {
      this.items[index] = claim;
    } else {
      this.items.push(claim);
    }
  }

  async findById(id: ExpertiseClaimId): Promise<ExpertiseClaim | null> {
    return this.items.find((item) => item.id === id) ?? null;
  }

  async existsByUserAndTag(userId: UserId, tag: ExpertiseTag): Promise<boolean> {
    return this.items.some((item) => item.userId === userId && item.tag.equals(tag));
  }
}

const CLAIMED_AT = Timestamp.fromISOString('2026-06-01T09:00:00.000Z');
const VERIFIED_AT = Timestamp.fromISOString('2026-06-02T10:00:00.000Z');

function unverifiedClaim(): ExpertiseClaim {
  return ExpertiseClaim.claim({
    id: ExpertiseClaimId('xpc_1'),
    userId: UserId('usr_a'),
    tag: ExpertiseTag.create('marine-biology'),
    claimedAt: CLAIMED_AT,
  });
}

let claims: InMemoryExpertiseClaimRepository;
let revoke: RevokeExpertiseVerification;

beforeEach(() => {
  claims = new InMemoryExpertiseClaimRepository();
  revoke = new RevokeExpertiseVerification(claims);
});

describe('RevokeExpertiseVerification', () => {
  it('clears verification on a verified claim and persists', async () => {
    const verified = unverifiedClaim().verify(
      ExpertiseVerification.byEmailDomain({ institution: 'NIH', emailDomain: 'nih.gov' }),
      VERIFIED_AT,
    );
    claims.items.push(verified);

    const claim = await revoke.execute({ claimId: 'xpc_1' });

    expect(claim.isVerified).toBe(false);
    expect(claim.verification.method).toBe('unverified');
    expect(claim.verifiedAt).toBeUndefined();
    const stored = await claims.findById(ExpertiseClaimId('xpc_1'));
    expect(stored?.isVerified).toBe(false);
  });

  it('is idempotent on an already-unverified claim', async () => {
    claims.items.push(unverifiedClaim());

    const claim = await revoke.execute({ claimId: 'xpc_1' });

    expect(claim.isVerified).toBe(false);
  });

  it('throws when the claim does not exist', async () => {
    await expect(revoke.execute({ claimId: 'xpc_missing' })).rejects.toBeInstanceOf(
      ExpertiseClaimNotFoundError,
    );
  });

  it('rejects a malformed id', async () => {
    await expect(revoke.execute({ claimId: '' })).rejects.toBeInstanceOf(InvalidIdentifierError);
  });
});
