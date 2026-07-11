const AuthService = require('../services/auth.service');
const UsageService = require('../services/usage.service');
const BillingService = require('../services/billing.service');

/**
 * Auth controller — handles request/response for auth endpoints.
 * Business logic is delegated to AuthService.
 */
const AuthController = {
  /**
   * POST /auth/register
   */
  async register(req, res, next) {
    try {
      const { user, isVerified } = await AuthService.register(req.body);

      res.status(201).json({
        success: true,
        data: {
          user,
          isVerified,
        },
        message: 'Registration successful. Please verify your email with the OTP code sent.',
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /auth/login
   */
  async login(req, res, next) {
    try {
      const { user, token } = await AuthService.login(req.body);

      res.json({
        success: true,
        data: {
          user,
          token,
        },
        message: 'Login successful',
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /auth/google
   */
  async googleLogin(req, res, next) {
    try {
      const { idToken } = req.body;
      const { user, token } = await AuthService.googleLogin(idToken);

      res.json({
        success: true,
        data: {
          user,
          token,
        },
        message: 'Google login successful',
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /auth/keys — Generate a new API key
   */
  async createApiKey(req, res, next) {
    try {
      const { name, scopes, expiresInDays } = req.body;
      const { key, apiKey } = await AuthService.createApiKey(
        req.user.userId,
        name,
        scopes,
        expiresInDays
      );

      res.status(201).json({
        success: true,
        data: {
          key, // raw key — shown only once
          ...apiKey,
        },
        message:
          'API key created. Save it now — you will not be able to see it again.',
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /auth/keys — List user's API keys
   */
  async listApiKeys(req, res, next) {
    try {
      const keys = await AuthService.listApiKeys(req.user.userId);

      res.json({
        success: true,
        data: keys,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * DELETE /auth/keys/:id — Revoke an API key
   */
  async revokeApiKey(req, res, next) {
    try {
      const result = await AuthService.revokeApiKey(
        req.params.id,
        req.user.userId
      );

      res.json({
        success: true,
        data: result,
        message: 'API key revoked successfully',
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /auth/usage — Get usage stats
   */
  async getUsage(req, res, next) {
    try {
      const stats = await UsageService.getStats(req.user.userId);

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /auth/me — Get current user profile
   */
  async getMe(req, res, next) {
    try {
      const user = await UserModel.findById(req.user.userId);
      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /auth/verify-otp
   */
  async verifyOtp(req, res, next) {
    try {
      const { user, token } = await AuthService.verifyOtp(req.body);

      res.json({
        success: true,
        data: {
          user,
          token,
        },
        message: 'Email verified successfully. Welcome to VerbaAI!',
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /auth/resend-otp
   */
  async resendOtp(req, res, next) {
    try {
      await AuthService.resendOtp(req.body);

      res.json({
        success: true,
        message: 'Verification OTP resent successfully.',
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /auth/logs — Get paginated request logs
   */
  async getLogs(req, res, next) {
    try {
      const { endpoint, statusCode, apiKeyId, search, page, limit } = req.query;
      const result = await UsageService.getLogs(req.user.userId, {
        endpoint,
        statusCode: statusCode ? parseInt(statusCode) : undefined,
        apiKeyId,
        search,
        page: page ? parseInt(page) : 1,
        limit: limit ? parseInt(limit) : 10,
      });

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /auth/create-checkout — Generate a Stripe Checkout link (or mock URL)
   */
  async createCheckoutSession(req, res, next) {
    try {
      const session = await BillingService.createCheckoutSession(req.user.userId);
      res.json({
        success: true,
        data: session,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /auth/razorpay-webhook — Handle incoming Razorpay webhooks
   */
  async handleRazorpayWebhook(req, res, next) {
    try {
      const signature = req.headers['x-razorpay-signature'];
      const result = await BillingService.handleWebhook(req.rawBody, signature);
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /auth/mock-upgrade — Instantly upgrade user in local environment
   */
  async verifyMockCheckout(req, res, next) {
    try {
      const { sessionId } = req.body;
      const result = await BillingService.verifyMockCheckout(req.user.userId, sessionId);
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = AuthController;
