const createApp = require('./app');
const { env } = require('./config/env');
const { connectDatabase } = require('./config/database');
const { connectRedis } = require('./config/redis');
const logger = require('./utils/logger');

/**
 * Server entry point.
 * Connects to all external services before starting the HTTP server.
 */
async function main() {
  try {
    // Connect to external services
    logger.info('🔌 Connecting to services...');
    await Promise.all([connectDatabase(), connectRedis()]);

    // Start BullMQ Worker
    require('./workers/batch.worker');

    // Create and start Express app
    const app = createApp();

    app.listen(env.PORT, () => {
      logger.info(`
╔══════════════════════════════════════════════════╗
║                                                  ║
║   ⚡ verbaai API                               ║
║                                                  ║
║   Server:  http://localhost:${String(env.PORT).padEnd(5)}              ║
║   Docs:    http://localhost:${String(env.PORT).padEnd(5)}/docs         ║
║   Health:  http://localhost:${String(env.PORT).padEnd(5)}/health       ║
║   Env:     ${String(env.NODE_ENV).padEnd(15)}                  ║
║                                                  ║
╚══════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received. Shutting down gracefully...');
  process.exit(0);
});

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Rejection:', reason);
});

main();
