import { createApp } from './app.js';
import { env } from './config/env.js';
import { prisma } from './lib/prisma.js';
import { startScheduler } from './scheduler.js';

async function main() {
  const app = createApp();

  const server = app.listen(env.PORT, () => {
    console.log(`🚀 Fiviko API listening on http://localhost:${env.PORT} (${env.NODE_ENV})`);
  });

  startScheduler();

  // Graceful shutdown so Prisma releases its connection pool cleanly.
  const shutdown = async (signal: string) => {
    console.log(`\n${signal} received, shutting down...`);
    server.close(async () => {
      await prisma.$disconnect();
      process.exit(0);
    });
  };
  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
}

main().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
