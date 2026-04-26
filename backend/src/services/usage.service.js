const UsageLogModel = require('../models/usageLog.model');
const logger = require('../utils/logger');

/**
 * Usage tracking service.
 * Records every API request for analytics and potential billing.
 */
const UsageService = {
  /**
   * Log an API request.
   * Runs asynchronously — does not block the response.
   *
   * @param {{ userId: string, apiKeyId: string, endpoint: string, tokensUsed?: number, cached?: boolean }} data
   */
  async log(data) {
    try {
      await UsageLogModel.create(data);
      logger.debug(`Usage logged: ${data.endpoint} for user ${data.userId}`);
    } catch (error) {
      // Usage logging should never break the request
      logger.error('Failed to log usage:', error.message);
    }
  },

  /**
   * Get usage statistics for a user.
   * @param {string} userId
   * @returns {Promise<Object>}
   */
  async getStats(userId) {
    return UsageLogModel.getStatsByUserId(userId);
  },
};

module.exports = UsageService;
