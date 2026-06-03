import { DisplayName, Email, Handle, User, UserId } from '@hestia/domain';
import { PrismaClient } from '@prisma/client';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { PrismaUserRepository } from './prisma-user-repository.js';

// Integration test: requires a reachable Postgres. Skipped when DATABASE_URL is
// unset. It deletes all rows in `users` around each test, so point it only at a
// throwaway dev database.
const databaseUrl = process.env.DATABASE_URL;

describe.skipIf(!databaseUrl)('PrismaUserRepository (integration)', () => {
  const prisma = new PrismaClient();
  const repository = new PrismaUserRepository(prisma);

  function sampleUser(overrides: Partial<Parameters<typeof User.register>[0]> = {}): User {
    return User.register({
      id: UserId('usr_int_1'),
      email: Email.create('ada@example.com'),
      handle: Handle.create('ada'),
      displayName: DisplayName.create('Ada Lovelace'),
      ...overrides,
    });
  }

  beforeEach(async () => {
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  it('persists a user and reports existence by email and handle', async () => {
    await repository.save(sampleUser());

    expect(await repository.existsByEmail(Email.create('ada@example.com'))).toBe(true);
    expect(await repository.existsByHandle(Handle.create('ada'))).toBe(true);
    expect(await repository.existsByEmail(Email.create('grace@example.com'))).toBe(false);
    expect(await repository.existsByHandle(Handle.create('grace'))).toBe(false);
  });

  it('upserts by id so saving an updated aggregate stays single-row', async () => {
    await repository.save(sampleUser());
    await repository.save(sampleUser().rename(DisplayName.create('Augusta Ada King')));

    const row = await prisma.user.findUnique({ where: { id: 'usr_int_1' } });
    expect(row?.displayName).toBe('Augusta Ada King');
    expect(await prisma.user.count()).toBe(1);
  });
});
