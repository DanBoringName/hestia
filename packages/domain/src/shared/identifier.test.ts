import { describe, expect, it } from 'vitest';
import { defineIdentifier, InvalidIdentifierError } from './identifier.js';

const UserId = defineIdentifier('UserId');

describe('defineIdentifier', () => {
  it('brands a non-empty value, preserving the underlying string', () => {
    const id = UserId('usr_123');

    expect(id).toBe('usr_123');
    expect(typeof id).toBe('string');
  });

  it('rejects an empty string', () => {
    expect(() => UserId('')).toThrow(InvalidIdentifierError);
  });

  it('rejects whitespace-only and surrounding-whitespace values', () => {
    expect(() => UserId('   ')).toThrow(InvalidIdentifierError);
    expect(() => UserId(' usr_123')).toThrow(InvalidIdentifierError);
    expect(() => UserId('usr_123 ')).toThrow(InvalidIdentifierError);
  });

  it('names the offending brand in the error', () => {
    expect(() => UserId('')).toThrow(/UserId/);
  });
});

describe('InvalidIdentifierError', () => {
  it('carries a validation code and category', () => {
    const error = new InvalidIdentifierError('UserId');

    expect(error.code).toBe('INVALID_IDENTIFIER');
    expect(error.category).toBe('validation');
  });
});
