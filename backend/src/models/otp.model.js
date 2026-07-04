const { prisma } = require('../config/database');

/**
 * OTP Data Access Layer.
 * Handles database operations for OTP verification codes.
 */
const OtpModel = {
  /**
   * Create or update an OTP code for an email.
   * @param {string} email
   * @param {string} code
   * @param {Date} expiresAt
   * @returns {Promise<Otp>}
   */
  async upsert(email, code, expiresAt) {
    return prisma.otp.upsert({
      where: { email },
      update: {
        code,
        expiresAt,
        createdAt: new Date(),
      },
      create: {
        email,
        code,
        expiresAt,
      },
    });
  },

  /**
   * Find an active OTP code by email.
   * @param {string} email
   * @returns {Promise<Otp|null>}
   */
  async findByEmail(email) {
    return prisma.otp.findUnique({
      where: { email },
    });
  },

  /**
   * Delete an OTP code (used after verification).
   * @param {string} email
   * @returns {Promise<Otp|null>}
   */
  async delete(email) {
    try {
      return await prisma.otp.delete({
        where: { email },
      });
    } catch {
      // Ignore if already deleted/not found
      return null;
    }
  },
};

module.exports = OtpModel;
