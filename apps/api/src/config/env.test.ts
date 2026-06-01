import { describe, expect, it } from 'vitest';
import { loadEnv } from './env.js';

describe('loadEnv', () => {
  it('applies defaults for an empty environment', () => {
    const env = loadEnv({});

    expect(env.NODE_ENV).toBe('development');
    expect(env.PORT).toBe(3000);
    expect(env.HOST).toBe('0.0.0.0');
    expect(env.LOG_LEVEL).toBe('info');
  });

  it('coerces PORT and honors provided values', () => {
    const env = loadEnv({ PORT: '8080', NODE_ENV: 'production', LOG_LEVEL: 'warn' });

    expect(env.PORT).toBe(8080);
    expect(env.NODE_ENV).toBe('production');
    expect(env.LOG_LEVEL).toBe('warn');
  });

  it('fails fast on invalid values', () => {
    expect(() => loadEnv({ PORT: 'not-a-number' })).toThrow(/Invalid environment/);
    expect(() => loadEnv({ NODE_ENV: 'staging' })).toThrow(/Invalid environment/);
  });
});
