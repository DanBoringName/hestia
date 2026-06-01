import { describe, expect, it } from 'vitest';
import { StringValueObject } from './value-object.js';

class Slug extends StringValueObject {
  static of(value: string): Slug {
    return new Slug(value);
  }
}

describe('StringValueObject', () => {
  it('exposes the wrapped value', () => {
    expect(Slug.of('alpha').value).toBe('alpha');
  });

  it('compares by value', () => {
    expect(Slug.of('alpha').equals(Slug.of('alpha'))).toBe(true);
    expect(Slug.of('alpha').equals(Slug.of('beta'))).toBe(false);
  });

  it('renders its value via toString', () => {
    expect(String(Slug.of('alpha'))).toBe('alpha');
  });
});
