const { redis } = require('../config/redis');
const { env } = require('../config/env');
const { hashText } = require('../utils/hash');
const logger = require('../utils/logger');

/**
 * Cache service — Redis-backed response caching.
 * Same input to the same endpoint returns cached output.
 */
const CacheService = {
  /**
   * Build a cache key from endpoint and input text.
   * @param {string} endpoint - e.g. "summarize"
   * @param {string} text
   * @returns {string}
   */
  _buildKey(endpoint, text) {
    const textHash = hashText(text);
    return `cache:${endpoint}:${textHash}`;
  },

  /**
   * Get cached result for an endpoint + input.
   * @param {string} endpoint
   * @param {string} text
   * @returns {Promise<Object|null>}
   */
  async get(endpoint, text) {
    try {
      const key = this._buildKey(endpoint, text);
      const cached = await redis.get(key);

      if (cached) {
        logger.debug(`Cache HIT: ${key}`);
        return JSON.parse(cached);
      }

      logger.debug(`Cache MISS: ${key}`);
      return null;
    } catch (error) {
      // Cache errors should not break the request
      logger.warn('Cache get error:', error.message);
      return null;
    }
  },

  /**
   * Store a result in cache.
   * @param {string} endpoint
   * @param {string} text
   * @param {Object} result
   * @returns {Promise<void>}
   */
  async set(endpoint, text, result) {
    try {
      const key = this._buildKey(endpoint, text);
      await redis.set(key, JSON.stringify(result), 'EX', env.CACHE_TTL);
      logger.debug(`Cache SET: ${key} (TTL: ${env.CACHE_TTL}s)`);
    } catch (error) {
      logger.warn('Cache set error:', error.message);
    }
  },
};

module.exports = CacheService;
