const AuthService = require('../services/auth.service');
const UsageService = require('../services/usage.service');

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
      const { user, token } = await AuthService.register(req.body);

      res.status(201).json({
        success: true,
        data: {
          user,
          token,
        },
        message: 'User registered successfully',
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
   * POST /auth/keys — Generate a new API key
   */
  async createApiKey(req, res, next) {
    try {
      const { key, apiKey } = await AuthService.createApiKey(
        req.user.userId,
        req.body.name
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
};

module.exports = AuthController;
