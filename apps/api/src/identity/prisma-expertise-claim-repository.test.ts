import {
  ExpertiseClaim,
  ExpertiseClaimId,
  ExpertiseTag,
  ExpertiseVerification,
  Timestamp,
  UserId,
} from '@hestia/domain';
import { PrismaClient } from '@prisma/client';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { PrismaExpertiseClaimRepository } from './prisma-expertise-claim-repository.js';

const databaseUrl = process.env.DATABASE_URL;

describe.skipIf(!databaseUrl)('PrismaExpertiseClaimRepository (integration)', () => {
  const prisma = new PrismaClient();
  const repository = new PrismaExpertiseClaimRepository(prisma);

  const USER = UserId('usr_ada');
  const TAG = ExpertiseTag.create('marine-biology');
  const CLAIMED_AT = Timestamp.fromISOString('2026-06-01T09:00:00.000Z');
  const VERIFIED_AT = Timestamp.fromISOString('2026-06-02T10:00:00.000Z');

  function unverified(): ExpertiseClaim {
    return ExpertiseClaim.claim({ id: ExpertiseClaimId('xpc_int_1'), userId: USER, tag: TAG, claimedAt: CLAIMED_AT });
  }

  beforeEach(async () => {
    await prisma.expertiseClaim.deleteMany();
  });

  afterAll(async () => {
    await prisma.expertiseClaim.deleteMany();
    await prisma.$disconnect();
  });

  it('persists and reloads an unverified claim', async () => {
    await repository.save(unverified());

    const loaded = await repository.findById(ExpertiseClaimId('xpc_int_1'));
    expect(loaded?.isVerified).toBe(false);
    expect(loaded?.tag.value).toBe('marine-biology');
    expect(loaded?.claimedAt.equals(CLAIMED_AT)).toBe(true);
    expect(loaded?.verifiedAt).toBeUndefined();
  });

  it('round-trips an email-domain verification', async () => {
    const verified = unverified().verify(
      ExpertiseVerification.byEmailDomain({ institution: 'NIH', emailDomain: 'nih.gov' }),
      VERIFIED_AT,
    );
    await repository.save(verified);

    const loaded = await repository.findById(ExpertiseClaimId('xpc_int_1'));
    expect(loaded?.verification.method).toBe('email-domain');
    expect(loaded?.verifiedAt?.equals(VERIFIED_AT)).toBe(true);
    const details = loaded?.verification.match({
      unverified: () => null,
      emailDomain: (d) => d,
      manualReview: () => null,
    });
    expect(details).toEqual({ institution: 'NIH', emailDomain: 'nih.gov' });
  });

  it('round-trips a manual-review verification', async () => {
    const verified = unverified().verify(
      ExpertiseVerification.byManualReview({
        reviewerId: UserId('usr_admin'),
        evidenceRef: 'evidence/diploma.pdf',
      }),
      VERIFIED_AT,
    );
    await repository.save(verified);

    const loaded = await repository.findById(ExpertiseClaimId('xpc_int_1'));
    expect(loaded?.verification.method).toBe('manual-review');
  });

  it('upserts by id and reports existence by user and tag', async () => {
    await repository.save(unverified());
    await repository.save(
      unverified().verify(
        ExpertiseVerification.byEmailDomain({ institution: 'NIH', emailDomain: 'nih.gov' }),
        VERIFIED_AT,
      ),
    );

    expect(await prisma.expertiseClaim.count()).toBe(1);
    expect(await repository.existsByUserAndTag(USER, TAG)).toBe(true);
    expect(await repository.existsByUserAndTag(USER, ExpertiseTag.create('tax-law'))).toBe(false);
  });

  it('returns null for a missing id', async () => {
    expect(await repository.findById(ExpertiseClaimId('xpc_missing'))).toBeNull();
  });
});
