const { prisma } = require('../config/database');

/**
 * User data access layer.
 * Handles all database operations for the User model.
 */
const UserModel = {
  /**
   * Create a new user.
   * @param {{ email: string, password: string, name: string }} data
   * @returns {Promise<User>}
   */
  async create(data) {
    return prisma.user.create({
      data: {
        email: data.email,
        password: data.password,
        name: data.name,
        googleId: data.googleId,
        authProvider: data.authProvider || 'local',
        isVerified: data.isVerified || false,
      },
      select: {
        id: true,
        email: true,
        name: true,
        isVerified: true,
        tier: true,
        createdAt: true,
      },
    });
  },

  /**
   * Find user by email (includes password for auth).
   * @param {string} email
   * @returns {Promise<User|null>}
   */
  async findByEmail(email) {
    return prisma.user.findUnique({
      where: { email },
    });
  },

  /**
   * Find user by Google ID.
   * @param {string} googleId
   * @returns {Promise<User|null>}
   */
  async findByGoogleId(googleId) {
    return prisma.user.findUnique({
      where: { googleId },
    });
  },

  /**
   * Find user by ID (excludes password).
   * @param {string} id
   * @returns {Promise<User|null>}
   */
  async findById(id) {
    return prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        isVerified: true,
        tier: true,
        createdAt: true,
      },
    });
  },

  /**
   * Mark a user as verified.
   * @param {string} email
   * @returns {Promise<User>}
   */
  async verify(email) {
    return prisma.user.update({
      where: { email },
      data: { isVerified: true },
    });
  },

  /**
   * Update a user's subscription tier.
   * @param {string} id
   * @param {string} tier
   * @returns {Promise<User>}
   */
  async updateTier(id, tier) {
    return prisma.user.update({
      where: { id },
      data: { tier },
      select: {
        id: true,
        email: true,
        name: true,
        tier: true,
      },
    });
  },
};

module.exports = UserModel;
