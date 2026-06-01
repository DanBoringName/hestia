/**
 * Base for value objects that wrap a single canonical string. Subclasses
 * validate and normalize in their static factory, then construct through the
 * inherited protected constructor. Equality and rendering are by value — value
 * objects have no identity.
 */
export abstract class StringValueObject {
  protected constructor(readonly value: string) {}

  equals(other: this): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
