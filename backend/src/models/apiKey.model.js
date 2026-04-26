const { prisma } = require('../config/database');

/**
 * API Key data access layer.
 */
const ApiKeyModel = {
  /**
   * Create a new API key record.
   * @param {{ keyHash: string, prefix: string, name: string, userId: string }} data
   * @returns {Promise<ApiKey>}
   */
  async create(data) {
    return prisma.apiKey.create({
      data: {
        keyHash: data.keyHash,
        prefix: data.prefix,
        name: data.name,
        userId: data.userId,
      },
      select: {
        id: true,
        prefix: true,
        name: true,
        active: true,
        createdAt: true,
      },
    });
  },

  /**
   * Find an API key by its hash.
   * Used during request authentication.
   * @param {string} keyHash
   * @returns {Promise<ApiKey|null>}
   */
  async findByHash(keyHash) {
    return prisma.apiKey.findUnique({
      where: { keyHash },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });
  },

  /**
   * List all API keys for a user.
   * @param {string} userId
   * @returns {Promise<ApiKey[]>}
   */
  async findByUserId(userId) {
    return prisma.apiKey.findMany({
      where: { userId },
      select: {
        id: true,
        prefix: true,
        name: true,
        active: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  /**
   * Deactivate an API key.
   * @param {string} id
   * @param {string} userId - ensure key belongs to user
   * @returns {Promise<ApiKey>}
   */
  async deactivate(id, userId) {
    return prisma.apiKey.update({
      where: { id, userId },
      data: { active: false },
      select: {
        id: true,
        prefix: true,
        name: true,
        active: true,
      },
    });
  },
};

module.exports = ApiKeyModel;
