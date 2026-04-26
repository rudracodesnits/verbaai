const { prisma } = require('../config/database');

/**
 * Usage Log data access layer.
 * Tracks every API request for analytics and billing.
 */
const UsageLogModel = {
  /**
   * Create a usage log entry.
   * @param {{ userId: string, apiKeyId: string, endpoint: string, tokensUsed?: number, cached?: boolean }} data
   * @returns {Promise<UsageLog>}
   */
  async create(data) {
    return prisma.usageLog.create({
      data: {
        userId: data.userId,
        apiKeyId: data.apiKeyId,
        endpoint: data.endpoint,
        tokensUsed: data.tokensUsed || 0,
        cached: data.cached || false,
      },
    });
  },

  /**
   * Get usage statistics for a user.
   * @param {string} userId
   * @param {{ from?: Date, to?: Date }} [dateRange]
   * @returns {Promise<Object>}
   */
  async getStatsByUserId(userId, dateRange = {}) {
    const where = { userId };

    if (dateRange.from || dateRange.to) {
      where.createdAt = {};
      if (dateRange.from) where.createdAt.gte = dateRange.from;
      if (dateRange.to) where.createdAt.lte = dateRange.to;
    }

    const [totalRequests, totalTokens, byEndpoint, recentLogs] =
      await Promise.all([
        prisma.usageLog.count({ where }),

        prisma.usageLog.aggregate({
          where,
          _sum: { tokensUsed: true },
        }),

        prisma.usageLog.groupBy({
          by: ['endpoint'],
          where,
          _count: { endpoint: true },
          _sum: { tokensUsed: true },
        }),

        prisma.usageLog.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          take: 20,
          select: {
            endpoint: true,
            tokensUsed: true,
            cached: true,
            createdAt: true,
          },
        }),
      ]);

    return {
      totalRequests,
      totalTokens: totalTokens._sum.tokensUsed || 0,
      byEndpoint: byEndpoint.map((e) => ({
        endpoint: e.endpoint,
        requests: e._count.endpoint,
        tokens: e._sum.tokensUsed || 0,
      })),
      recentLogs,
    };
  },
};

module.exports = UsageLogModel;
