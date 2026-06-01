import { defineConfig } from 'vitest/config';

// API tests: unit tests for config/controllers and integration tests for
// adapters. Node environment; integration tests that need Postgres guard on a
// reachable DATABASE_URL.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
