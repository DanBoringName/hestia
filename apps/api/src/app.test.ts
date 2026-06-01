import { describe, expect, it } from 'vitest';
import { buildApp } from './app.js';

describe('health route', () => {
  it('responds with ok', async () => {
    const app = buildApp({ NODE_ENV: 'test', PORT: 3000, HOST: '0.0.0.0', LOG_LEVEL: 'silent' });

    const response = await app.inject({ method: 'GET', url: '/health' });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: 'ok' });

    await app.close();
  });
});
