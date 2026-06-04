import { describe, expect, it } from 'vitest';
import { buildApp } from '../app.js';
import { inMemoryContainer, testEnv } from '../testing/in-memory-container.js';

async function request(app: ReturnType<typeof buildApp>, requesterId: string, addresseeId: string) {
  return app.inject({
    method: 'POST',
    url: '/friendships',
    payload: { requesterId, addresseeId },
  });
}

describe('POST /friendships', () => {
  it('creates a pending friendship and returns 201', async () => {
    const app = buildApp(testEnv, inMemoryContainer());

    const response = await request(app, 'usr_a', 'usr_b');

    expect(response.statusCode).toBe(201);
    const body = response.json();
    expect(body.status).toBe('pending');
    expect(body.requesterId).toBe('usr_a');
    expect(body.addresseeId).toBe('usr_b');
    expect(typeof body.id).toBe('string');

    await app.close();
  });

  it('maps a self-request to 400', async () => {
    const app = buildApp(testEnv, inMemoryContainer());

    const response = await request(app, 'usr_a', 'usr_a');

    expect(response.statusCode).toBe(400);
    expect(response.json().error.code).toBe('CANNOT_BEFRIEND_SELF');

    await app.close();
  });

  it('maps a duplicate live friendship to 409', async () => {
    const app = buildApp(testEnv, inMemoryContainer());
    await request(app, 'usr_a', 'usr_b');

    const response = await request(app, 'usr_b', 'usr_a');

    expect(response.statusCode).toBe(409);
    expect(response.json().error.code).toBe('DUPLICATE_FRIENDSHIP');

    await app.close();
  });

  it('returns 400 for an invalid body', async () => {
    const app = buildApp(testEnv, inMemoryContainer());

    const response = await app.inject({ method: 'POST', url: '/friendships', payload: { requesterId: 'usr_a' } });

    expect(response.statusCode).toBe(400);
    expect(response.json().error.code).toBe('INVALID_REQUEST');

    await app.close();
  });
});

describe('POST /friendships/:id/response', () => {
  it('lets the addressee accept, returning 200 accepted', async () => {
    const app = buildApp(testEnv, inMemoryContainer());
    const created = await request(app, 'usr_a', 'usr_b');
    const id = created.json().id;

    const response = await app.inject({
      method: 'POST',
      url: `/friendships/${id}/response`,
      payload: { actorId: 'usr_b', response: 'accept' },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().status).toBe('accepted');
    expect(response.json().respondedAt).not.toBeNull();

    await app.close();
  });

  it('maps a non-addressee responder to 403', async () => {
    const app = buildApp(testEnv, inMemoryContainer());
    const created = await request(app, 'usr_a', 'usr_b');
    const id = created.json().id;

    const response = await app.inject({
      method: 'POST',
      url: `/friendships/${id}/response`,
      payload: { actorId: 'usr_a', response: 'accept' },
    });

    expect(response.statusCode).toBe(403);
    expect(response.json().error.code).toBe('FRIENDSHIP_ACTOR_NOT_PERMITTED');

    await app.close();
  });

  it('maps a missing friendship to 404', async () => {
    const app = buildApp(testEnv, inMemoryContainer());

    const response = await app.inject({
      method: 'POST',
      url: '/friendships/frn_missing/response',
      payload: { actorId: 'usr_b', response: 'accept' },
    });

    expect(response.statusCode).toBe(404);
    expect(response.json().error.code).toBe('FRIENDSHIP_NOT_FOUND');

    await app.close();
  });

  it('returns 400 for an invalid response value', async () => {
    const app = buildApp(testEnv, inMemoryContainer());
    const created = await request(app, 'usr_a', 'usr_b');
    const id = created.json().id;

    const response = await app.inject({
      method: 'POST',
      url: `/friendships/${id}/response`,
      payload: { actorId: 'usr_b', response: 'maybe' },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().error.code).toBe('INVALID_REQUEST');

    await app.close();
  });
});
