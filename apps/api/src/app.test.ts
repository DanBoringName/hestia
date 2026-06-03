import { RegisterUser } from '@hestia/application';
import { InMemoryUserRepository, SequentialIdGenerator } from '@hestia/application/testing';
import { describe, expect, it } from 'vitest';
import { buildApp } from './app.js';
import type { Env } from './config/env.js';
import type { Container } from './container.js';

const env: Env = {
  NODE_ENV: 'test',
  PORT: 3000,
  HOST: '0.0.0.0',
  LOG_LEVEL: 'silent',
  DATABASE_URL: 'postgres://unused-in-memory',
};

function inMemoryContainer(): Container {
  const registerUser = new RegisterUser(new InMemoryUserRepository(), new SequentialIdGenerator('usr'));
  return { registerUser, shutdown: () => Promise.resolve() };
}

describe('GET /health', () => {
  it('responds with ok', async () => {
    const app = buildApp(env, inMemoryContainer());

    const response = await app.inject({ method: 'GET', url: '/health' });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: 'ok' });

    await app.close();
  });
});

describe('POST /users', () => {
  it('registers a user and returns 201 with the normalized representation', async () => {
    const app = buildApp(env, inMemoryContainer());

    const response = await app.inject({
      method: 'POST',
      url: '/users',
      payload: { email: '  Ada@Example.com ', handle: 'Ada', displayName: '  Ada Lovelace ' },
    });

    expect(response.statusCode).toBe(201);
    expect(response.json()).toEqual({
      id: 'usr_1',
      email: 'ada@example.com',
      handle: 'ada',
      displayName: 'Ada Lovelace',
    });

    await app.close();
  });

  it('returns 400 when the body is missing fields', async () => {
    const app = buildApp(env, inMemoryContainer());

    const response = await app.inject({
      method: 'POST',
      url: '/users',
      payload: { email: 'ada@example.com' },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().error.code).toBe('INVALID_REQUEST');

    await app.close();
  });

  it('maps a domain validation error to 400', async () => {
    const app = buildApp(env, inMemoryContainer());

    const response = await app.inject({
      method: 'POST',
      url: '/users',
      payload: { email: 'not-an-email', handle: 'ada', displayName: 'Ada' },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().error.code).toBe('INVALID_EMAIL');

    await app.close();
  });

  it('maps a uniqueness conflict to 409', async () => {
    const app = buildApp(env, inMemoryContainer());
    const payload = { email: 'ada@example.com', handle: 'ada', displayName: 'Ada' };
    await app.inject({ method: 'POST', url: '/users', payload });

    const response = await app.inject({
      method: 'POST',
      url: '/users',
      payload: { ...payload, handle: 'adalovelace' },
    });

    expect(response.statusCode).toBe(409);
    expect(response.json().error.code).toBe('EMAIL_TAKEN');

    await app.close();
  });
});
