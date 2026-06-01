import { describe, expect, it } from 'vitest';
import { Handle, HANDLE_MAX_LENGTH, InvalidHandleError } from './handle.js';

describe('Handle.create', () => {
  it('normalizes by trimming and lower-casing', () => {
    expect(Handle.create('  Ada_Lovelace  ').value).toBe('ada_lovelace');
  });

  it('accepts the boundary lengths', () => {
    expect(Handle.create('abc').value).toBe('abc');
    expect(Handle.create(`a${'b'.repeat(HANDLE_MAX_LENGTH - 1)}`).value).toHaveLength(
      HANDLE_MAX_LENGTH,
    );
  });

  it('rejects empty input', () => {
    expect(() => Handle.create('')).toThrow(InvalidHandleError);
    expect(() => Handle.create('   ')).toThrow(InvalidHandleError);
  });

  it.each(['ab', `a${'b'.repeat(HANDLE_MAX_LENGTH)}`])(
    'rejects out-of-range length %j',
    (bad) => {
      expect(() => Handle.create(bad)).toThrow(InvalidHandleError);
    },
  );

  it.each([
    '1abc',
    '_abc',
    'ab-cd',
    'ab.cd',
    'ab cd',
    'abcé',
  ])('rejects the malformed handle %j', (bad) => {
    expect(() => Handle.create(bad)).toThrow(InvalidHandleError);
  });
});

describe('Handle equality', () => {
  it('treats case-variant handles as equal', () => {
    expect(Handle.create('AdaLovelace').equals(Handle.create('adalovelace'))).toBe(true);
  });

  it('distinguishes different handles', () => {
    expect(Handle.create('ada').equals(Handle.create('grace'))).toBe(false);
  });

  it('renders its canonical value via toString', () => {
    expect(String(Handle.create('  Turing  '))).toBe('turing');
  });
});

describe('InvalidHandleError', () => {
  it('carries a validation code and category', () => {
    const error = new InvalidHandleError('value is empty');

    expect(error.code).toBe('INVALID_HANDLE');
    expect(error.category).toBe('validation');
  });
});
