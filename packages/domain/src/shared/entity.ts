/**
 * Base for entities — domain objects defined by identity rather than attributes.
 * Two entities of the same type are equal when their `id` matches, regardless of
 * their other fields. Subclasses pass `id` to `super` and own the rest of their
 * fields and behavior.
 */
export abstract class Entity<TId extends string> {
  protected constructor(readonly id: TId) {}

  equals(other: this): boolean {
    return this.id === other.id;
  }
}
