import { RegisterUser, RequestFriendship, RespondToFriendship } from '@hestia/application';
import { PrismaClient } from '@prisma/client';
import { SystemClock } from './adapters/system-clock.js';
import { UuidIdGenerator } from './adapters/uuid-id-generator.js';
import type { Env } from './config/env.js';
import { PrismaFriendshipRepository } from './identity/prisma-friendship-repository.js';
import { PrismaUserRepository } from './identity/prisma-user-repository.js';

/**
 * The wired use cases the HTTP layer depends on, plus a shutdown hook for the
 * resources behind them. This is the only place concrete adapters meet use
 * cases; everything else depends on interfaces.
 */
export interface Container {
  readonly registerUser: RegisterUser;
  readonly requestFriendship: RequestFriendship;
  readonly respondToFriendship: RespondToFriendship;
  shutdown(): Promise<void>;
}

/** Composition root: build the production dependency graph from validated config. */
export function createContainer(env: Env): Container {
  const prisma = new PrismaClient({ datasourceUrl: env.DATABASE_URL });
  const clock = new SystemClock();
  const ids = new UuidIdGenerator();

  const users = new PrismaUserRepository(prisma);
  const friendships = new PrismaFriendshipRepository(prisma);

  return {
    registerUser: new RegisterUser(users, ids),
    requestFriendship: new RequestFriendship(friendships, ids, clock),
    respondToFriendship: new RespondToFriendship(friendships, clock),
    shutdown: () => prisma.$disconnect(),
  };
}
