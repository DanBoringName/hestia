/**
 * Source of fresh, unique identifier strings. Keeps randomness out of the
 * domain and use cases — a use case calls {@link IdGenerator.generate} and
 * brands the result with the relevant id factory (e.g. `UserId(...)`).
 * Adapters back this with UUIDs or another collision-resistant scheme.
 */
export interface IdGenerator {
  generate(): string;
}
