import {
  ExpertiseClaim,
  ExpertiseClaimId,
  ExpertiseTag,
  InvalidIdentifierError,
  InvalidVerificationError,
  Timestamp,
  UserId,
} from '@hestia/domain';
import { beforeEach, describe, expect, it } from 'vitest';
import type { Clock } from '../ports/clock.js';
import type { ExpertiseClaimRepository } from './expertise-claim-repository.js';
import { ExpertiseClaimNotFoundError, VerifyExpertise } from './verify-expertise.js';

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
const clock: Clock = { now: () => VERIFIED_AT };

let claims: InMemoryExpertiseClaimRepository;
let verifyExpertise: VerifyExpertise;

function seedClaim(): void {
  claims.items.push(
    ExpertiseClaim.claim({
      id: ExpertiseClaimId('xpc_1'),
      userId: UserId('usr_a'),
      tag: ExpertiseTag.create('marine-biology'),
      claimedAt: CLAIMED_AT,
    }),
  );
}

beforeEach(() => {
  claims = new InMemoryExpertiseClaimRepository();
  verifyExpertise = new VerifyExpertise(claims, clock);
});

describe('VerifyExpertise', () => {
  it('verifies by email domain, stamping verifiedAt and persisting', async () => {
    seedClaim();

    const claim = await verifyExpertise.execute({
      claimId: 'xpc_1',
      verification: { method: 'email-domain', institution: 'NIH', emailDomain: 'nih.gov' },
    });

    expect(claim.isVerified).toBe(true);
    expect(claim.verification.method).toBe('email-domain');
    expect(claim.verifiedAt?.equals(VERIFIED_AT)).toBe(true);
    const stored = await claims.findById(ExpertiseClaimId('xpc_1'));
    expect(stored?.isVerified).toBe(true);
  });

  it('verifies by manual review', async () => {
    seedClaim();

    const claim = await verifyExpertise.execute({
      claimId: 'xpc_1',
      verification: {
        method: 'manual-review',
        reviewerId: 'usr_admin',
        evidenceRef: 'evidence/diploma.pdf',
      },
    });

    expect(claim.verification.method).toBe('manual-review');
  });

  it('throws when the claim does not exist', async () => {
    await expect(
      verifyExpertise.execute({
        claimId: 'xpc_missing',
        verification: { method: 'email-domain', institution: 'NIH', emailDomain: 'nih.gov' },
      }),
    ).rejects.toBeInstanceOf(ExpertiseClaimNotFoundError);
  });

  it('lets the domain reject invalid verification details', async () => {
    seedClaim();

    await expect(
      verifyExpertise.execute({
        claimId: 'xpc_1',
        verification: { method: 'email-domain', institution: '  ', emailDomain: 'nih.gov' },
      }),
    ).rejects.toBeInstanceOf(InvalidVerificationError);
  });

  it('rejects a malformed reviewer id', async () => {
    seedClaim();

    await expect(
      verifyExpertise.execute({
        claimId: 'xpc_1',
        verification: { method: 'manual-review', reviewerId: '', evidenceRef: 'evidence/x.pdf' },
      }),
    ).rejects.toBeInstanceOf(InvalidIdentifierError);
  });

  it('exposes the not-found error as a DomainError', () => {
    expect(new ExpertiseClaimNotFoundError().code).toBe('EXPERTISE_CLAIM_NOT_FOUND');
    expect(new ExpertiseClaimNotFoundError().category).toBe('not-found');
  });
});
