import { defineConfig } from 'vitest/config';

// Domain tests are pure and synchronous — no DOM, no IO. The node environment
// is all they need. Adapter/integration tests live in apps/* with their own config.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});