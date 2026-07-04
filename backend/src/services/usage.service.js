const UsageLogModel = require('../models/usageLog.model');
const logger = require('../utils/logger');
const { prisma } = require('../config/database');

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
      
      // Fire and forget budget check
      UsageService.checkBudgetAlert(data.userId).catch(err => {
        logger.error('Failed to check budget alert: ' + err.message);
      });
    } catch (error) {
      // Usage logging should never break the request
      logger.error('Failed to log usage:', error.message);
    }
  },

  async checkBudgetAlert(userId) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return;
    
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    const stats = await UsageLogModel.getStatsByUserId(userId, { from: startOfMonth });
    const usage = stats.totalTokens;
    const thresholdTokens = user.monthlyBudget * (user.alertThreshold / 100);
    
    if (usage >= thresholdTokens) {
      const existingAlert = await prisma.alert.findFirst({
        where: {
          userId,
          type: 'BUDGET_WARNING',
          createdAt: { gte: startOfMonth }
        }
      });
      
      if (!existingAlert) {
        await prisma.alert.create({
          data: {
            userId,
            type: 'BUDGET_WARNING',
            message: `Usage Warning: You have exceeded ${user.alertThreshold}% of your monthly budget (${user.monthlyBudget} tokens).`
          }
        });
        logger.info(`Budget alert created for user ${userId}`);
      }
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

  /**
   * Get usage logs for a user with filters.
   * @param {string} userId
   * @param {Object} filters
   * @returns {Promise<Object>}
   */
  async getLogs(userId, filters) {
    return UsageLogModel.getLogsByUserId(userId, filters);
  },
};

module.exports = UsageService;
