const { redis } = require('../config/redis');
const { env } = require('../config/env');
const { TooManyRequestsError } = require('../utils/errors');
const logger = require('../utils/logger');

/**
 * Redis-based rate limiting middleware.
 * Limits requests per user per day.
 *
 * Redis key: ratelimit:{userId}:{YYYY-MM-DD}
 * Limit: RATE_LIMIT_PER_DAY (default 100)
 *
 * Must be used AFTER apiKeyMiddleware (needs req.apiUser).
 */
async function rateLimiterMiddleware(req, res, next) {
  try {
    const userId = req.apiUser.id;
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const key = `ratelimit:${userId}:${today}`;

    // Increment counter
    const current = await redis.incr(key);

    // Set expiry on first request of the day (86400 seconds = 24 hours)
    if (current === 1) {
      await redis.expire(key, 86400);
    }

    const tier = req.apiUser.tier || 'FREE';
    let limit = env.RATE_LIMIT_PER_DAY;

    if (tier === 'PRO') {
      limit = 5000;
    } else if (tier === 'ENTERPRISE') {
      limit = 100000;
    } else {
      limit = 100;
    }

    const remaining = Math.max(0, limit - current);

    // Set rate limit headers
    res.set({
      'X-RateLimit-Limit': String(limit),
      'X-RateLimit-Remaining': String(remaining),
      'X-RateLimit-Reset': today,
    });

    if (current > limit) {
      logger.warn(`Rate limit exceeded for user ${userId}`);
      throw new TooManyRequestsError(
        `Rate limit exceeded. Limit: ${limit} requests/day. Resets at midnight UTC.`
      );
    }

    next();
  } catch (error) {
    if (error instanceof TooManyRequestsError) {
      return next(error);
    }
    // Redis errors should not block requests
    logger.error('Rate limiter error:', error.message);
    next();
  }
}

module.exports = rateLimiterMiddleware;
