const { env } = require('../config/env');
const UserModel = require('../models/user.model');
const logger = require('../utils/logger');
const Razorpay = require('razorpay');
const crypto = require('crypto');

let razorpay = null;

if (env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET) {
  razorpay = new Razorpay({
    key_id: env.RAZORPAY_KEY_ID,
    key_secret: env.RAZORPAY_KEY_SECRET,
  });
}

const BillingService = {
  /**
   * Create a checkout session.
   * If Razorpay credentials are not set, returns a mock checkout link for dev.
   */
  async createCheckoutSession(userId) {
    const user = await UserModel.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    if (!razorpay) {
      logger.info(`Razorpay is not configured. Generating mock checkout session for user ${userId}`);
      // Dev bypass: redirect to local frontend success page with a mock query param
      const mockCheckoutUrl = `${env.FRONTEND_URL}/dashboard?session_id=mock_session_${Date.now()}`;
      return { url: mockCheckoutUrl, isMock: true };
    }

    try {
      const paymentLink = await razorpay.paymentLink.create({
        amount: 99900, // 999 INR (amount in paise)
        currency: 'INR',
        accept_partial: false,
        description: 'Upgrade to VerbaAI PRO',
        customer: {
          name: user.name || 'User',
          email: user.email,
        },
        notify: {
          sms: false,
          email: true,
        },
        reminder_enable: true,
        callback_url: `${env.FRONTEND_URL}/dashboard?session_id=rzp_session_${Date.now()}`,
        callback_method: 'get',
        notes: {
          userId: user.id,
        },
      });

      return { url: paymentLink.short_url, isMock: false };
    } catch (error) {
      logger.error('Failed to create Razorpay Payment Link:', error.message);
      throw error;
    }
  },

  /**
   * Process a Razorpay webhook payload.
   */
  async handleWebhook(rawBody, signature) {
    if (!razorpay || !env.RAZORPAY_WEBHOOK_SECRET) {
      logger.warn('Razorpay webhook received but Razorpay or webhook secret is not configured.');
      return { success: false, message: 'Razorpay not configured' };
    }

    try {
      const expectedSignature = crypto
        .createHmac('sha256', env.RAZORPAY_WEBHOOK_SECRET)
        .update(rawBody)
        .digest('hex');

      if (expectedSignature !== signature) {
        throw new Error('Signature mismatch');
      }

      const event = JSON.parse(rawBody.toString());

      if (event.event === 'payment_link.paid') {
        const paymentLink = event.payload.payment_link.entity;
        const userId = paymentLink.notes?.userId;

        if (userId) {
          await UserModel.updateTier(userId, 'PRO');
          logger.info(`✅ User ${userId} upgraded to PRO via Razorpay webhook`);
          return { success: true, userId, event: event.event };
        }
      }

      return { success: true, event: event.event };
    } catch (error) {
      logger.error('Razorpay webhook verification failed:', error.message);
      throw new Error(`Webhook Error: ${error.message}`);
    }
  },

  /**
   * Helper to verify mock checkout.
   */
  async verifyMockCheckout(userId, sessionId) {
    if (sessionId && (sessionId.startsWith('mock_session_') || sessionId.startsWith('rzp_session_'))) {
      await UserModel.updateTier(userId, 'PRO');
      logger.info(`✅ User ${userId} upgraded to PRO via Mock checkout`);
      return { success: true, tier: 'PRO' };
    }
    return { success: false, message: 'Invalid session ID' };
  }
};

module.exports = BillingService;
