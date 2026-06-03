import { buildApp } from './app.js';
import { loadEnv } from './config/env.js';
import { createContainer } from './container.js';

const env = loadEnv();
const container = createContainer(env);
const app = buildApp(env, container);

async function shutdown(signal: string): Promise<void> {
  app.log.info(`received ${signal}, shutting down`);
  await app.close();
  await container.shutdown();
  process.exit(0);
}

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));

try {
  await app.listen({ port: env.PORT, host: env.HOST });
} catch (error) {
  app.log.error(error);
  await container.shutdown();
  process.exit(1);
}
