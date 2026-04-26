const Redis = require('ioredis');
const { env } = require('./env');
const logger = require('../utils/logger');

/**
 * Redis client singleton.
 * Used for rate limiting and response caching.
 */
const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    const delay = Math.min(times * 200, 2000);
    return delay;
  },
  lazyConnect: true,
});

redis.on('connect', () => {
  logger.info('✅ Redis connected');
});

redis.on('error', (err) => {
  logger.error('❌ Redis error:', err.message);
});

/**
 * Connect to Redis.
 */
async function connectRedis() {
  try {
    await redis.connect();
  } catch (error) {
    logger.error('❌ Redis connection failed:', error.message);
    process.exit(1);
  }
}

module.exports = { redis, connectRedis };
