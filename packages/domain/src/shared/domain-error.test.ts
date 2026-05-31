import { describe, expect, it } from 'vitest';
import { DomainError, isDomainError } from './domain-error.js';

class SampleNotFoundError extends DomainError {
  readonly code = 'SAMPLE_NOT_FOUND';
  readonly category = 'not-found' as const;
}

describe('DomainError', () => {
  it('exposes code, category, and message', () => {
    const error = new SampleNotFoundError('sample 42 was not found');

    expect(error.code).toBe('SAMPLE_NOT_FOUND');
    expect(error.category).toBe('not-found');
    expect(error.message).toBe('sample 42 was not found');
  });

  it('sets name to the concrete subclass', () => {
    expect(new SampleNotFoundError('x').name).toBe('SampleNotFoundError');
  });

  it('is an instance of both DomainError and Error', () => {
    const error = new SampleNotFoundError('x');

    expect(error).toBeInstanceOf(DomainError);
    expect(error).toBeInstanceOf(Error);
  });

  it('preserves an optional cause', () => {
    const cause = new Error('underlying');
    const error = new SampleNotFoundError('x', { cause });

    expect(error.cause).toBe(cause);
  });
});

describe('isDomainError', () => {
  it('accepts domain errors and rejects everything else', () => {
    expect(isDomainError(new SampleNotFoundError('x'))).toBe(true);
    expect(isDomainError(new Error('plain'))).toBe(false);
    expect(isDomainError('not-an-error')).toBe(false);
    expect(isDomainError(null)).toBe(false);
  });
});