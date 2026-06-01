import { describe, expect, it } from 'vitest';
import { Email, InvalidEmailError } from './email.js';

describe('Email.create', () => {
  it('normalizes by trimming and lower-casing', () => {
    const email = Email.create('  Ada.Lovelace@Cam.AC.uk  ');

    expect(email.value).toBe('ada.lovelace@cam.ac.uk');
  });

  it('exposes the domain part', () => {
    expect(Email.create('researcher@nih.gov').domain).toBe('nih.gov');
  });

  it('rejects empty and whitespace-only input', () => {
    expect(() => Email.create('')).toThrow(InvalidEmailError);
    expect(() => Email.create('   ')).toThrow(InvalidEmailError);
  });

  it.each([
    'no-at-sign',
    '@no-local.com',
    'no-domain@',
    'no-tld@example',
    'has space@example.com',
    'two@@example.com',
  ])('rejects the malformed address %j', (bad) => {
    expect(() => Email.create(bad)).toThrow(InvalidEmailError);
  });

  it('rejects an address longer than 254 characters', () => {
    const tooLong = `${'a'.repeat(250)}@b.com`;

    expect(() => Email.create(tooLong)).toThrow(InvalidEmailError);
  });
});

describe('Email equality', () => {
  it('treats case-variant addresses as equal', () => {
    expect(Email.create('A@B.com').equals(Email.create('a@b.com'))).toBe(true);
  });

  it('distinguishes different addresses', () => {
    expect(Email.create('a@b.com').equals(Email.create('c@d.com'))).toBe(false);
  });

  it('renders its canonical value via toString', () => {
    expect(String(Email.create('  Person@Example.com '))).toBe('person@example.com');
  });
});

describe('InvalidEmailError', () => {
  it('carries a validation code and category', () => {
    const error = new InvalidEmailError('value is empty');

    expect(error.code).toBe('INVALID_EMAIL');
    expect(error.category).toBe('validation');
  });
});
