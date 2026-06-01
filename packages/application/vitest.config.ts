import { defineConfig } from 'vitest/config';

// Application tests exercise use cases against in-memory port fakes — pure and
// synchronous, so the node environment suffices. Real adapter integration tests
// live in apps/* with their own config.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
