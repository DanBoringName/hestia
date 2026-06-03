import { RegisterUser } from '@hestia/application';
import { PrismaClient } from '@prisma/client';
import { UuidIdGenerator } from './adapters/uuid-id-generator.js';
import type { Env } from './config/env.js';
import { PrismaUserRepository } from './identity/prisma-user-repository.js';

/**
 * The wired use cases the HTTP layer depends on, plus a shutdown hook for the
 * resources behind them. This is the only place concrete adapters meet use
 * cases; everything else depends on interfaces.
 */
export interface Container {
  readonly registerUser: RegisterUser;
  shutdown(): Promise<void>;
}

/** Composition root: build the production dependency graph from validated config. */
export function createContainer(env: Env): Container {
  const prisma = new PrismaClient({ datasourceUrl: env.DATABASE_URL });
  const registerUser = new RegisterUser(new PrismaUserRepository(prisma), new UuidIdGenerator());

  return {
    registerUser,
    shutdown: () => prisma.$disconnect(),
  };
}
