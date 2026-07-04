const { env } = require('../config/env');
const UserModel = require('../models/user.model');
const logger = require('../utils/logger');
let stripe = null;

if (env.STRIPE_SECRET_KEY) {
  stripe = require('stripe')(env.STRIPE_SECRET_KEY);
}

const BillingService = {
  /**
   * Create a checkout session.
   * If Stripe secret key is not set, returns a mock checkout link for dev.
   */
  async createCheckoutSession(userId) {
    const user = await UserModel.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    if (!stripe) {
      logger.info(`Stripe is not configured. Generating mock checkout session for user ${userId}`);
      // Dev bypass: redirect to local frontend success page with a mock query param
      const mockCheckoutUrl = `${env.FRONTEND_URL}/dashboard?session_id=mock_session_${Date.now()}`;
      return { url: mockCheckoutUrl, isMock: true };
    }

    try {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price: env.STRIPE_PRICE_ID,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: `${env.FRONTEND_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${env.FRONTEND_URL}/dashboard?status=cancelled`,
        customer_email: user.email,
        metadata: {
          userId: user.id,
        },
      });

      return { url: session.url, isMock: false };
    } catch (error) {
      logger.error('Failed to create Stripe Checkout session:', error.message);
      throw error;
    }
  },

  /**
   * Process a Stripe webhook payload.
   */
  async handleWebhook(rawBody, signature) {
    if (!stripe || !env.STRIPE_WEBHOOK_SECRET) {
      logger.warn('Stripe webhook received but Stripe or webhook secret is not configured.');
      return { success: false, message: 'Stripe not configured' };
    }

    try {
      const event = stripe.webhooks.constructEvent(
        rawBody,
        signature,
        env.STRIPE_WEBHOOK_SECRET
      );

      if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        const userId = session.metadata?.userId;

        if (userId) {
          await UserModel.updateTier(userId, 'PRO');
          logger.info(`✅ User ${userId} upgraded to PRO via Stripe webhook`);
          return { success: true, userId, event: event.type };
        }
      }

      return { success: true, event: event.type };
    } catch (error) {
      logger.error('Stripe webhook verification failed:', error.message);
      throw new Error(`Webhook Error: ${error.message}`);
    }
  },

  /**
   * Helper to verify mock checkout.
   */
  async verifyMockCheckout(userId, sessionId) {
    if (sessionId && sessionId.startsWith('mock_session_')) {
      await UserModel.updateTier(userId, 'PRO');
      logger.info(`✅ User ${userId} upgraded to PRO via Mock checkout`);
      return { success: true, tier: 'PRO' };
    }
    return { success: false, message: 'Invalid session ID' };
  }
};

module.exports = BillingService;
