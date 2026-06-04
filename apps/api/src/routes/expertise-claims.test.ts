import { describe, expect, it } from 'vitest';
import { buildApp } from '../app.js';
import { inMemoryContainer, testEnv } from '../testing/in-memory-container.js';

async function claim(app: ReturnType<typeof buildApp>, userId: string, tag: string) {
  return app.inject({ method: 'POST', url: '/expertise-claims', payload: { userId, tag } });
}

describe('POST /expertise-claims', () => {
  it('creates a self-asserted claim and returns 201', async () => {
    const app = buildApp(testEnv, inMemoryContainer());

    const response = await claim(app, 'usr_a', 'Marine Biology');

    expect(response.statusCode).toBe(201);
    const body = response.json();
    expect(body.tag).toBe('marine-biology');
    expect(body.verified).toBe(false);
    expect(body.verification).toEqual({ method: 'unverified' });

    await app.close();
  });

  it('maps a duplicate topic to 409', async () => {
    const app = buildApp(testEnv, inMemoryContainer());
    await claim(app, 'usr_a', 'marine-biology');

    const response = await claim(app, 'usr_a', 'Marine Biology');

    expect(response.statusCode).toBe(409);
    expect(response.json().error.code).toBe('DUPLICATE_EXPERTISE_CLAIM');

    await app.close();
  });

  it('maps an invalid tag to 400', async () => {
    const app = buildApp(testEnv, inMemoryContainer());

    const response = await claim(app, 'usr_a', '!!!');

    expect(response.statusCode).toBe(400);
    expect(response.json().error.code).toBe('INVALID_EXPERTISE_TAG');

    await app.close();
  });

  it('returns 400 for an invalid body', async () => {
    const app = buildApp(testEnv, inMemoryContainer());

    const response = await app.inject({ method: 'POST', url: '/expertise-claims', payload: { userId: 'usr_a' } });

    expect(response.statusCode).toBe(400);
    expect(response.json().error.code).toBe('INVALID_REQUEST');

    await app.close();
  });
});

describe('POST /expertise-claims/:id/verification', () => {
  it('verifies by email domain and returns 200', async () => {
    const app = buildApp(testEnv, inMemoryContainer());
    const id = (await claim(app, 'usr_a', 'marine-biology')).json().id;

    const response = await app.inject({
      method: 'POST',
      url: `/expertise-claims/${id}/verification`,
      payload: { method: 'email-domain', institution: 'NIH', emailDomain: 'nih.gov' },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().verified).toBe(true);
    expect(response.json().verification.method).toBe('email-domain');

    await app.close();
  });

  it('maps a missing claim to 404', async () => {
    const app = buildApp(testEnv, inMemoryContainer());

    const response = await app.inject({
      method: 'POST',
      url: '/expertise-claims/xpc_missing/verification',
      payload: { method: 'manual-review', reviewerId: 'usr_admin', evidenceRef: 'ref' },
    });

    expect(response.statusCode).toBe(404);
    expect(response.json().error.code).toBe('EXPERTISE_CLAIM_NOT_FOUND');

    await app.close();
  });

  it('returns 400 for an unknown verification method', async () => {
    const app = buildApp(testEnv, inMemoryContainer());
    const id = (await claim(app, 'usr_a', 'marine-biology')).json().id;

    const response = await app.inject({
      method: 'POST',
      url: `/expertise-claims/${id}/verification`,
      payload: { method: 'orcid' },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().error.code).toBe('INVALID_REQUEST');

    await app.close();
  });
});

describe('DELETE /expertise-claims/:id/verification', () => {
  it('revokes verification and returns 200 unverified', async () => {
    const app = buildApp(testEnv, inMemoryContainer());
    const id = (await claim(app, 'usr_a', 'marine-biology')).json().id;
    await app.inject({
      method: 'POST',
      url: `/expertise-claims/${id}/verification`,
      payload: { method: 'email-domain', institution: 'NIH', emailDomain: 'nih.gov' },
    });

    const response = await app.inject({ method: 'DELETE', url: `/expertise-claims/${id}/verification` });

    expect(response.statusCode).toBe(200);
    expect(response.json().verified).toBe(false);
    expect(response.json().verification).toEqual({ method: 'unverified' });

    await app.close();
  });

  it('maps a missing claim to 404', async () => {
    const app = buildApp(testEnv, inMemoryContainer());

    const response = await app.inject({ method: 'DELETE', url: '/expertise-claims/xpc_missing/verification' });

    expect(response.statusCode).toBe(404);

    await app.close();
  });
});
