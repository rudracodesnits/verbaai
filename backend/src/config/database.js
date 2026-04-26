const { PrismaClient } = require('@prisma/client');
const { env } = require('./env');
const logger = require('../utils/logger');

/**
 * Prisma client singleton.
 * In development, we reuse the client across hot-reloads.
 */
const globalForPrisma = globalThis;

const prisma =
  globalForPrisma.__prisma ||
  new PrismaClient({
    log: env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (env.NODE_ENV !== 'production') {
  globalForPrisma.__prisma = prisma;
}

/**
 * Connect to database with retry logic.
 */
async function connectDatabase() {
  try {
    await prisma.$connect();
    logger.info('✅ Database connected');
  } catch (error) {
    logger.error('❌ Database connection failed:', error.message);
    process.exit(1);
  }
}

module.exports = { prisma, connectDatabase };
