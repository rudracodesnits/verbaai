const ApiKeyModel = require('../models/apiKey.model');
const { hashApiKey } = require('../utils/hash');
const { UnauthorizedError, ForbiddenError } = require('../utils/errors');

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

    // DEV BYPASS: Allow a dummy key for testing without having to pay or setup auth
    if (rawKey === 'free-test-key' && process.env.NODE_ENV === 'development') {
      req.apiUser = { id: 'dev-user-id', name: 'Dev User', email: 'dev@verbaai.com' };
      req.apiKeyRecord = { id: 'dev-key-id', prefix: 'free', name: 'Test Key' };
      return next();
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

    // Check expiration date
    if (apiKey.expiresAt && new Date() > new Date(apiKey.expiresAt)) {
      throw new UnauthorizedError('API key has expired');
    }

    // Check endpoint scope (e.g. "summarize", "sentiment", "toxicity", "keywords", "chat")
    // Assert scope if key has restricted permissions
    if (apiKey.scopes && apiKey.scopes.length > 0) {
      const endpoint = req.path.split('/').filter(Boolean).pop();
      const isStatusQuery = req.path.includes('/status/');

      if (!isStatusQuery && !apiKey.scopes.includes(endpoint)) {
        throw new ForbiddenError(
          `API key does not have permission to access the /${endpoint} endpoint. Required scope: ${endpoint}`
        );
      }
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
