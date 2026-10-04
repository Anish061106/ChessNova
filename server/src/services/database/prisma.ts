import { PrismaClient } from '@prisma/client';
import { logger } from '../../utils/logger.js';

// Global declaration for development Prisma singleton caching
declare global {
  // eslint-disable-next-line no-var
  var prismaGlobal: PrismaClient | undefined;
}

export const prisma: PrismaClient =
  globalThis.prismaGlobal ||
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? [
            { emit: 'event', level: 'query' },
            { emit: 'stdout', level: 'error' },
            { emit: 'stdout', level: 'warn' },
          ]
        : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalThis.prismaGlobal = prisma;
}

// Check database connectivity safely
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    logger.warn('[Database] Connection check failed:', (error as Error).message);
    return false;
  }
}

// Graceful shutdown handler
export async function disconnectDatabase(): Promise<void> {
  try {
    await prisma.$disconnect();
    logger.info('[Database] Disconnected cleanly from PostgreSQL');
  } catch (err) {
    logger.error('[Database] Error during disconnect:', err);
  }
}
