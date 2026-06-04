import { RegisterUser, RequestFriendship, RespondToFriendship } from '@hestia/application';
import {
  fixedClock,
  InMemoryFriendshipRepository,
  InMemoryUserRepository,
  SequentialIdGenerator,
} from '@hestia/application/testing';
import { Timestamp } from '@hestia/domain';
import type { Env } from '../config/env.js';
import type { Container } from '../container.js';

export const testEnv: Env = {
  NODE_ENV: 'test',
  PORT: 3000,
  HOST: '0.0.0.0',
  LOG_LEVEL: 'silent',
  DATABASE_URL: 'postgres://unused-in-memory',
};

/** A {@link Container} wired entirely from in-memory fakes, for controller tests. */
export function inMemoryContainer(): Container {
  const clock = fixedClock(Timestamp.fromISOString('2026-06-01T00:00:00.000Z'));
  const users = new InMemoryUserRepository();
  const friendships = new InMemoryFriendshipRepository();

  return {
    registerUser: new RegisterUser(users, new SequentialIdGenerator('usr')),
    requestFriendship: new RequestFriendship(friendships, new SequentialIdGenerator('frn'), clock),
    respondToFriendship: new RespondToFriendship(friendships, clock),
    shutdown: () => Promise.resolve(),
  };
}
