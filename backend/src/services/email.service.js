const logger = require('../utils/logger');

/**
 * Email Service.
 * In production, you would configure nodemailer, Resend, or SendGrid.
 * In development, we log the verification codes clearly to the console log.
 */
const EmailService = {
  /**
   * Send a verification OTP to a user.
   * @param {string} email
   * @param {string} code
   * @returns {Promise<boolean>}
   */
  async sendOtp(email, code) {
    logger.info(`
┌────────────────────────────────────────────────────────┐
│  📧 VERBAAI EMAIL VERIFICATION                         │
├────────────────────────────────────────────────────────┤
│  To:      ${email.padEnd(44)} │
│  OTP:     ${code.padEnd(44)} │
│  Expires: 10 minutes                                   │
└────────────────────────────────────────────────────────┘
    `);
    
    return true;
  },
};

module.exports = EmailService;
