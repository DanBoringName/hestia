import { InvalidExpertiseTagError, InvalidIdentifierError, Timestamp } from '@hestia/domain';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  fixedClock,
  InMemoryExpertiseClaimRepository,
  SequentialIdGenerator,
} from '../testing/index.js';
import { ClaimExpertise, DuplicateExpertiseClaimError } from './claim-expertise.js';

const NOW = Timestamp.fromISOString('2026-06-01T09:00:00.000Z');

let claims: InMemoryExpertiseClaimRepository;
let claimExpertise: ClaimExpertise;

beforeEach(() => {
  claims = new InMemoryExpertiseClaimRepository();
  claimExpertise = new ClaimExpertise(claims, new SequentialIdGenerator('xpc'), fixedClock(NOW));
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
