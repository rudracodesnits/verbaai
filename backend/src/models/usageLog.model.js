const { prisma } = require('../config/database');

/**
 * Usage Log data access layer.
 * Tracks every API request for analytics and billing.
 */
const UsageLogModel = {
  /**
   * Create a usage log entry.
   * @param {{ userId: string, apiKeyId: string, endpoint: string, tokensUsed?: number, cached?: boolean, latency?: number, error?: boolean, statusCode?: number }} data
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
        latency: data.latency || 0,
        error: data.error || false,
        statusCode: data.statusCode || 200,
        inputText: data.inputText,
        outputText: data.outputText,
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

    const [totalRequests, totalTokens, rawGroupedStats, recentLogs, globalAggregates] =
      await Promise.all([
        prisma.usageLog.count({ where }),

        prisma.usageLog.aggregate({
          where,
          _sum: { tokensUsed: true },
        }),

        prisma.usageLog.groupBy({
          by: ['endpoint', 'cached', 'error'],
          where,
          _count: { id: true },
          _sum: { tokensUsed: true },
          _avg: { latency: true },
        }),

        prisma.usageLog.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          take: 20,
          select: {
            endpoint: true,
            tokensUsed: true,
            cached: true,
            latency: true,
            error: true,
            statusCode: true,
            createdAt: true,
          },
        }),

        prisma.usageLog.aggregate({
          where,
          _avg: { latency: true },
        }),
      ]);

    const endpointStatsMap = {};
    let globalErrorCount = 0;
    let globalCacheHitCount = 0;

    for (const group of rawGroupedStats) {
      const ep = group.endpoint;
      const count = group._count.id;
      const tokens = group._sum.tokensUsed || 0;
      const avgLatency = group._avg.latency || 0;
      const isCached = group.cached;
      const isError = group.error;

      if (isError) globalErrorCount += count;
      if (isCached) globalCacheHitCount += count;

      if (!endpointStatsMap[ep]) {
        endpointStatsMap[ep] = {
          endpoint: ep,
          requests: 0,
          tokens: 0,
          totalLatency: 0,
          latencyRequestCount: 0,
          errorCount: 0,
          cacheHits: 0,
        };
      }

      const stats = endpointStatsMap[ep];
      stats.requests += count;
      stats.tokens += tokens;
      if (!isCached) {
        stats.totalLatency += (avgLatency * count);
        stats.latencyRequestCount += count;
      }
      if (isError) stats.errorCount += count;
      if (isCached) stats.cacheHits += count;
    }

    const byEndpoint = Object.values(endpointStatsMap).map((stats) => {
      const avgLatency = stats.latencyRequestCount > 0 
        ? Math.round(stats.totalLatency / stats.latencyRequestCount) 
        : 0;
      const errorRate = stats.requests > 0 
        ? parseFloat(((stats.errorCount / stats.requests) * 100).toFixed(1)) 
        : 0;
      const cacheHitRate = stats.requests > 0 
        ? parseFloat(((stats.cacheHits / stats.requests) * 100).toFixed(1)) 
        : 0;

      return {
        endpoint: stats.endpoint,
        requests: stats.requests,
        tokens: stats.tokens,
        avgLatency,
        errorRate,
        cacheHitRate,
      };
    });

    const avgLatency = globalAggregates._avg.latency 
      ? Math.round(globalAggregates._avg.latency) 
      : 0;
    const errorRate = totalRequests > 0 
      ? parseFloat(((globalErrorCount / totalRequests) * 100).toFixed(1)) 
      : 0;
    const cacheHitRate = totalRequests > 0 
      ? parseFloat(((globalCacheHitCount / totalRequests) * 100).toFixed(1)) 
      : 0;

    return {
      totalRequests,
      totalTokens: totalTokens._sum.tokensUsed || 0,
      avgLatency,
      errorRate,
      cacheHitRate,
      byEndpoint,
      recentLogs,
    };
  },

  /**
   * Query logs for a user with filters.
   * @param {string} userId
   * @param {Object} filters
   * @returns {Promise<{ logs: UsageLog[], pagination: Object }>}
   */
  async getLogsByUserId(userId, filters = {}) {
    const { endpoint, statusCode, apiKeyId, search, page = 1, limit = 10 } = filters;
    const skip = (page - 1) * limit;

    const where = { userId };
    if (endpoint) where.endpoint = endpoint;
    if (statusCode) where.statusCode = statusCode;
    if (apiKeyId) where.apiKeyId = apiKeyId;

    if (search) {
      where.OR = [
        { inputText: { contains: search, mode: 'insensitive' } },
        { outputText: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [logs, total] = await Promise.all([
      prisma.usageLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          apiKey: {
            select: {
              name: true,
              prefix: true,
            },
          },
        },
      }),
      prisma.usageLog.count({ where }),
    ]);

    return {
      logs,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  },
};

module.exports = UsageLogModel;
