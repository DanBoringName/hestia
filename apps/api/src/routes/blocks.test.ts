import { describe, expect, it } from 'vitest';
import { buildApp } from '../app.js';
import { inMemoryContainer, testEnv } from '../testing/in-memory-container.js';

describe('POST /blocks', () => {
  it('places a block and returns 204, idempotently', async () => {
    const app = buildApp(testEnv, inMemoryContainer());

    const first = await app.inject({
      method: 'POST',
      url: '/blocks',
      payload: { blockerId: 'usr_a', blockedId: 'usr_b' },
    });
    const second = await app.inject({
      method: 'POST',
      url: '/blocks',
      payload: { blockerId: 'usr_a', blockedId: 'usr_b' },
    });

    expect(first.statusCode).toBe(204);
    expect(second.statusCode).toBe(204);

    await app.close();
  });

  it('maps a self-block to 400', async () => {
    const app = buildApp(testEnv, inMemoryContainer());

    const response = await app.inject({
      method: 'POST',
      url: '/blocks',
      payload: { blockerId: 'usr_a', blockedId: 'usr_a' },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().error.code).toBe('CANNOT_BLOCK_SELF');

    await app.close();
  });

  it('returns 400 for an invalid body', async () => {
    const app = buildApp(testEnv, inMemoryContainer());

    const response = await app.inject({ method: 'POST', url: '/blocks', payload: { blockerId: 'usr_a' } });

    expect(response.statusCode).toBe(400);
    expect(response.json().error.code).toBe('INVALID_REQUEST');

    await app.close();
  });
});

describe('DELETE /blocks', () => {
  it('lifts a block and returns 204, idempotently when none exists', async () => {
    const app = buildApp(testEnv, inMemoryContainer());
    await app.inject({ method: 'POST', url: '/blocks', payload: { blockerId: 'usr_a', blockedId: 'usr_b' } });

    const removed = await app.inject({
      method: 'DELETE',
      url: '/blocks',
      payload: { blockerId: 'usr_a', blockedId: 'usr_b' },
    });
    const again = await app.inject({
      method: 'DELETE',
      url: '/blocks',
      payload: { blockerId: 'usr_a', blockedId: 'usr_b' },
    });

    expect(removed.statusCode).toBe(204);
    expect(again.statusCode).toBe(204);

    await app.close();
  });

  it('returns 400 for an invalid body', async () => {
    const app = buildApp(testEnv, inMemoryContainer());

    const response = await app.inject({ method: 'DELETE', url: '/blocks', payload: { blockedId: 'usr_b' } });

    expect(response.statusCode).toBe(400);

    await app.close();
  });
});
