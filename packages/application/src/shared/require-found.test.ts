import { DomainError } from '@hestia/domain';
import { describe, expect, it } from 'vitest';
import { requireFound } from './require-found.js';

class SampleNotFoundError extends DomainError {
  readonly code = 'SAMPLE_NOT_FOUND';
  readonly category = 'not-found' as const;
}

describe('requireFound', () => {
  it('returns the value when present', () => {
    expect(requireFound('x', () => new SampleNotFoundError('missing'))).toBe('x');
  });

  it('throws the supplied error when the value is null', () => {
    expect(() => requireFound(null, () => new SampleNotFoundError('missing'))).toThrow(
      SampleNotFoundError,
    );
  });

  it('builds the error lazily — not on the found path', () => {
    let built = 0;

    requireFound('x', () => {
      built += 1;
      return new SampleNotFoundError('missing');
    });

    expect(built).toBe(0);
  });
});
