import {
  ExpertiseClaim,
  ExpertiseClaimId,
  ExpertiseTag,
  InvalidExpertiseTagError,
  InvalidIdentifierError,
  Timestamp,
  UserId,
} from '@hestia/domain';
import { beforeEach, describe, expect, it } from 'vitest';
import type { Clock } from '../ports/clock.js';
import type { IdGenerator } from '../ports/id-generator.js';
import type { ExpertiseClaimRepository } from './expertise-claim-repository.js';
import { ClaimExpertise, DuplicateExpertiseClaimError } from './claim-expertise.js';

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

class SequentialIdGenerator implements IdGenerator {
  private count = 0;

  generate(): string {
    this.count += 1;
    return `xpc_${this.count}`;
  }
}

const NOW = Timestamp.fromISOString('2026-06-01T09:00:00.000Z');
const clock: Clock = { now: () => NOW };

let claims: InMemoryExpertiseClaimRepository;
let claimExpertise: ClaimExpertise;

beforeEach(() => {
  claims = new InMemoryExpertiseClaimRepository();
  claimExpertise = new ClaimExpertise(claims, new SequentialIdGenerator(), clock);
});

describe('ClaimExpertise', () => {
  it('creates a self-asserted, slug-normalized claim stamped with the current time', async () => {
    const claim = await claimExpertise.execute({ userId: 'usr_a', tag: 'Marine Biology' });

    expect(claim.id).toBe('xpc_1');
    expect(claim.userId).toBe('usr_a');
    expect(claim.tag.value).toBe('marine-biology');
    expect(claim.isVerified).toBe(false);
    expect(claim.claimedAt.equals(NOW)).toBe(true);
    expect(claims.items).toHaveLength(1);
  });

  it('rejects a duplicate topic for the same user, across spelling variants', async () => {
    await claimExpertise.execute({ userId: 'usr_a', tag: 'marine-biology' });

    await expect(
      claimExpertise.execute({ userId: 'usr_a', tag: 'Marine Biology' }),
    ).rejects.toBeInstanceOf(DuplicateExpertiseClaimError);
  });

  it('allows the same topic for different users', async () => {
    await claimExpertise.execute({ userId: 'usr_a', tag: 'marine-biology' });
    await claimExpertise.execute({ userId: 'usr_b', tag: 'marine-biology' });

    expect(claims.items).toHaveLength(2);
  });

  it('rejects a malformed tag or user id', async () => {
    await expect(
      claimExpertise.execute({ userId: 'usr_a', tag: '!!!' }),
    ).rejects.toBeInstanceOf(InvalidExpertiseTagError);
    await expect(
      claimExpertise.execute({ userId: '', tag: 'marine-biology' }),
    ).rejects.toBeInstanceOf(InvalidIdentifierError);
  });

  it('exposes the duplicate conflict as a DomainError', () => {
    expect(new DuplicateExpertiseClaimError('marine-biology').code).toBe(
      'DUPLICATE_EXPERTISE_CLAIM',
    );
    expect(new DuplicateExpertiseClaimError('marine-biology').category).toBe('conflict');
  });
});
