const jwt = require('jsonwebtoken');
const { env } = require('../config/env');
const UserModel = require('../models/user.model');
const ApiKeyModel = require('../models/apiKey.model');
const { hashPassword, comparePassword, generateApiKey, hashApiKey } = require('../utils/hash');
const { ConflictError, UnauthorizedError, NotFoundError } = require('../utils/errors');

/**
 * Authentication service.
 * Handles user registration, login, and API key management.
 */
const AuthService = {
  /**
   * Register a new user.
   * @param {{ email: string, password: string, name: string }} data
   * @returns {Promise<{ user: User, token: string }>}
   */
  async register(data) {
    // Check if email is already taken
    const existing = await UserModel.findByEmail(data.email);
    if (existing) {
      throw new ConflictError('Email is already registered');
    }

    // Hash password and create user
    const hashedPassword = await hashPassword(data.password);
    const user = await UserModel.create({
      ...data,
      password: hashedPassword,
    });

    // Generate JWT
    const token = this._generateToken(user);

    return { user, token };
  },

  /**
   * Authenticate a user.
   * @param {{ email: string, password: string }} data
   * @returns {Promise<{ user: User, token: string }>}
   */
  async login(data) {
    const user = await UserModel.findByEmail(data.email);
    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const isValid = await comparePassword(data.password, user.password);
    if (!isValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const token = this._generateToken(user);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt,
      },
      token,
    };
  },

  /**
   * Generate a new API key for a user.
   * @param {string} userId
   * @param {string} [name]
   * @returns {Promise<{ key: string, apiKey: ApiKey }>}
   */
  async createApiKey(userId, name = 'Default') {
    // Verify user exists
    const user = await UserModel.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Generate raw key and hash it
    const rawKey = generateApiKey();
    const keyHash = hashApiKey(rawKey);
    const prefix = rawKey.substring(0, 12); // "tfk_" + 8 hex chars

    const apiKey = await ApiKeyModel.create({
      keyHash,
      prefix,
      name,
      userId,
    });

    // Return the raw key only once — it cannot be retrieved again
    return {
      key: rawKey,
      apiKey,
    };
  },

  /**
   * List API keys for a user (prefix only, never full key).
   * @param {string} userId
   * @returns {Promise<ApiKey[]>}
   */
  async listApiKeys(userId) {
    return ApiKeyModel.findByUserId(userId);
  },

  /**
   * Revoke (deactivate) an API key.
   * @param {string} keyId
   * @param {string} userId
   * @returns {Promise<ApiKey>}
   */
  async revokeApiKey(keyId, userId) {
    try {
      return await ApiKeyModel.deactivate(keyId, userId);
    } catch {
      throw new NotFoundError('API key not found');
    }
  },

  /**
   * Generate a JWT token.
   * @param {{ id: string, email: string }} user
   * @returns {string}
   */
  _generateToken(user) {
    return jwt.sign(
      { userId: user.id, email: user.email },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN }
    );
  },
};

module.exports = AuthService;
