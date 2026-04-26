const ApiKeyModel = require('../models/apiKey.model');
const { hashApiKey } = require('../utils/hash');
const { UnauthorizedError } = require('../utils/errors');

/**
 * API Key authentication middleware.
 * Used for NLP endpoints (/api/*).
 *
 * Expects: x-api-key header with a valid API key.
 * Sets: req.apiUser = { id, email, name }
 *       req.apiKeyRecord = { id, ... }
 */
async function apiKeyMiddleware(req, _res, next) {
  try {
    const rawKey = req.headers['x-api-key'];

    if (!rawKey) {
      throw new UnauthorizedError('Missing x-api-key header');
    }

    // Hash the key and look up in database
    const keyHash = hashApiKey(rawKey);
    const apiKey = await ApiKeyModel.findByHash(keyHash);

    if (!apiKey) {
      throw new UnauthorizedError('Invalid API key');
    }

    if (!apiKey.active) {
      throw new UnauthorizedError('API key has been revoked');
    }

    // Attach user and key info to request
    req.apiUser = apiKey.user;
    req.apiKeyRecord = {
      id: apiKey.id,
      prefix: apiKey.prefix,
      name: apiKey.name,
    };

    next();
  } catch (error) {
    next(error);
  }
}

module.exports = apiKeyMiddleware;
