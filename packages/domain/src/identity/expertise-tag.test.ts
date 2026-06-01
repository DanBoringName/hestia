import { describe, expect, it } from 'vitest';
import {
  ExpertiseTag,
  EXPERTISE_TAG_MAX_LENGTH,
  InvalidExpertiseTagError,
} from './expertise-tag.js';

describe('ExpertiseTag.create', () => {
  it.each([
    ['Marine Biology', 'marine-biology'],
    ['marine_biology', 'marine-biology'],
    ['  Roman   History  ', 'roman-history'],
    ['tax-law', 'tax-law'],
    ['--tax--law--', 'tax-law'],
  ])('normalizes %j to %j', (raw, expected) => {
    expect(ExpertiseTag.create(raw).value).toBe(expected);
  });

  it('accepts alphanumeric tags', () => {
    expect(ExpertiseTag.create('covid19').value).toBe('covid19');
  });

  it('accepts the maximum length', () => {
    const tag = 'a'.repeat(EXPERTISE_TAG_MAX_LENGTH);

    expect(ExpertiseTag.create(tag).value).toBe(tag);
  });

  it('rejects input that normalizes to empty', () => {
    expect(() => ExpertiseTag.create('')).toThrow(InvalidExpertiseTagError);
    expect(() => ExpertiseTag.create('   ')).toThrow(InvalidExpertiseTagError);
    expect(() => ExpertiseTag.create('---')).toThrow(InvalidExpertiseTagError);
  });

  it('rejects a single-character tag', () => {
    expect(() => ExpertiseTag.create('a')).toThrow(InvalidExpertiseTagError);
  });

  it('rejects input longer than the maximum', () => {
    expect(() => ExpertiseTag.create('a'.repeat(EXPERTISE_TAG_MAX_LENGTH + 1))).toThrow(
      InvalidExpertiseTagError,
    );
  });

  it.each(['café-science', 'tax/law', 'c++'])(
    'rejects non-ASCII or punctuation in %j',
    (bad) => {
      expect(() => ExpertiseTag.create(bad)).toThrow(InvalidExpertiseTagError);
    },
  );
});

describe('ExpertiseTag equality', () => {
  it('treats inputs with the same canonical slug as equal', () => {
    expect(
      ExpertiseTag.create('Marine Biology').equals(ExpertiseTag.create('marine-biology')),
    ).toBe(true);
  });

  it('distinguishes different tags', () => {
    expect(ExpertiseTag.create('tax-law').equals(ExpertiseTag.create('roman-history'))).toBe(
      false,
    );
  });

  it('renders its slug via toString', () => {
    expect(String(ExpertiseTag.create('Marine Biology'))).toBe('marine-biology');
  });
});

describe('InvalidExpertiseTagError', () => {
  it('carries a validation code and category', () => {
    const error = new InvalidExpertiseTagError('value is empty');

    expect(error.code).toBe('INVALID_EXPERTISE_TAG');
    expect(error.category).toBe('validation');
  });
});
