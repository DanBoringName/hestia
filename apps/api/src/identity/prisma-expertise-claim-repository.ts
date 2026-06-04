import type { ExpertiseClaimRepository } from '@hestia/application';
import {
  ExpertiseClaim,
  ExpertiseClaimId,
  ExpertiseTag,
  ExpertiseVerification,
  UserId,
} from '@hestia/domain';
import type { PrismaClient } from '@prisma/client';
import { toDate, toTimestamp } from '../adapters/timestamps.js';

interface VerificationColumns {
  verificationMethod: string;
  institution: string | null;
  emailDomain: string | null;
  reviewerId: string | null;
  evidenceRef: string | null;
}

/**
 * Prisma-backed {@link ExpertiseClaimRepository}. The verification discriminated
 * union is flattened to columns on save (via `match`) and rebuilt on load before
 * {@link ExpertiseClaim.reconstitute}. `save` upserts by id; existence is by the
 * unique (user, tag) pair.
 */
export class PrismaExpertiseClaimRepository implements ExpertiseClaimRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(claim: ExpertiseClaim): Promise<void> {
    const fields = {
      userId: claim.userId,
      tag: claim.tag.value,
      claimedAt: toDate(claim.claimedAt),
      verifiedAt: claim.verifiedAt ? toDate(claim.verifiedAt) : null,
      ...toColumns(claim.verification),
    };

    await this.prisma.expertiseClaim.upsert({
      where: { id: claim.id },
      create: { id: claim.id, ...fields },
      update: fields,
    });
  }

  async findById(id: ExpertiseClaimId): Promise<ExpertiseClaim | null> {
    const row = await this.prisma.expertiseClaim.findUnique({ where: { id } });
    if (row === null) {
      return null;
    }

    return ExpertiseClaim.reconstitute({
      id: ExpertiseClaimId(row.id),
      userId: UserId(row.userId),
      tag: ExpertiseTag.create(row.tag),
      verification: toVerification(row),
      claimedAt: toTimestamp(row.claimedAt),
      verifiedAt: row.verifiedAt ? toTimestamp(row.verifiedAt) : undefined,
    });
  }

  async existsByUserAndTag(userId: UserId, tag: ExpertiseTag): Promise<boolean> {
    const count = await this.prisma.expertiseClaim.count({
      where: { userId, tag: tag.value },
    });
    return count > 0;
  }
}

function toColumns(verification: ExpertiseVerification): VerificationColumns {
  return verification.match<VerificationColumns>({
    unverified: () => ({
      verificationMethod: 'unverified',
      institution: null,
      emailDomain: null,
      reviewerId: null,
      evidenceRef: null,
    }),
    emailDomain: (details) => ({
      verificationMethod: 'email-domain',
      institution: details.institution,
      emailDomain: details.emailDomain,
      reviewerId: null,
      evidenceRef: null,
    }),
    manualReview: (details) => ({
      verificationMethod: 'manual-review',
      institution: null,
      emailDomain: null,
      reviewerId: details.reviewerId,
      evidenceRef: details.evidenceRef,
    }),
  });
}

function toVerification(row: VerificationColumns): ExpertiseVerification {
  switch (row.verificationMethod) {
    case 'email-domain':
      return ExpertiseVerification.byEmailDomain({
        institution: row.institution ?? '',
        emailDomain: row.emailDomain ?? '',
      });
    case 'manual-review':
      return ExpertiseVerification.byManualReview({
        reviewerId: UserId(row.reviewerId ?? ''),
        evidenceRef: row.evidenceRef ?? '',
      });
    default:
      return ExpertiseVerification.unverified();
  }
}
