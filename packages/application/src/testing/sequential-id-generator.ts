import type { IdGenerator } from '../ports/id-generator.js';

/** Deterministic {@link IdGenerator} for tests: `${prefix}_1`, `${prefix}_2`, … */
export class SequentialIdGenerator implements IdGenerator {
  private count = 0;

  constructor(private readonly prefix = 'id') {}

  generate(): string {
    this.count += 1;
    return `${this.prefix}_${this.count}`;
  }
}
