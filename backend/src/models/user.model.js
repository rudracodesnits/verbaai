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
      },
      select: {
        id: true,
        email: true,
        name: true,
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
        createdAt: true,
      },
    });
  },
};

module.exports = UserModel;
