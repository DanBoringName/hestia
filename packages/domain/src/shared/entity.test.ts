import { describe, expect, it } from 'vitest';
import { Entity } from './entity.js';
import { defineIdentifier, type Identifier } from './identifier.js';

type WidgetId = Identifier<'WidgetId'>;
const WidgetId = defineIdentifier('WidgetId');

class Widget extends Entity<WidgetId> {
  constructor(
    id: WidgetId,
    readonly label: string,
  ) {
    super(id);
  }
}

describe('Entity', () => {
  it('exposes its id', () => {
    expect(new Widget(WidgetId('w1'), 'a').id).toBe('w1');
  });

  it('is equal by identity, ignoring other attributes', () => {
    expect(new Widget(WidgetId('w1'), 'a').equals(new Widget(WidgetId('w1'), 'b'))).toBe(true);
  });

  it('distinguishes different ids', () => {
    expect(new Widget(WidgetId('w1'), 'a').equals(new Widget(WidgetId('w2'), 'a'))).toBe(false);
  });
});
