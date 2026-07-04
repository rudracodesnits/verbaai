const jwt = require('jsonwebtoken');
const { env } = require('../config/env');
const UserModel = require('../models/user.model');
const ApiKeyModel = require('../models/apiKey.model');
const OtpModel = require('../models/otp.model');
const EmailService = require('./email.service');
const { hashPassword, comparePassword, generateApiKey, hashApiKey } = require('../utils/hash');
const { ConflictError, UnauthorizedError, NotFoundError, ForbiddenError } = require('../utils/errors');
const { OAuth2Client } = require('google-auth-library');

const googleClient = new OAuth2Client(env.GOOGLE_CLIENT_ID);

/**
 * Authentication service.
 * Handles user registration, login, and API key management.
 */
const AuthService = {
  /**
   * Register a new user.
   * @param {{ email: string, password: string, name: string }} data
   * @returns {Promise<{ user: User, isVerified: boolean }>}
   */
  async register(data) {
    // Check if email is already taken
    const existing = await UserModel.findByEmail(data.email);
    if (existing) {
      throw new ConflictError('Email is already registered');
    }

    // Hash password and create user (unverified by default)
    const hashedPassword = await hashPassword(data.password);
    const user = await UserModel.create({
      ...data,
      password: hashedPassword,
      isVerified: false,
    });

    // Generate OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await OtpModel.upsert(data.email, code, expiresAt);
    await EmailService.sendOtp(data.email, code);

    return { user, isVerified: false };
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

    if (!user.isVerified) {
      throw new ForbiddenError('Please verify your email address to continue.');
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
   * Authenticate or register a user via Google.
   * @param {string} idToken
   * @returns {Promise<{ user: User, token: string }>}
   */
  async googleLogin(idToken) {
    if (!env.GOOGLE_CLIENT_ID) {
      throw new ConflictError('Google OAuth is not configured on the server.');
    }

    let ticket;
    try {
      ticket = await googleClient.verifyIdToken({
        idToken,
        audience: env.GOOGLE_CLIENT_ID,
      });
    } catch (error) {
      throw new UnauthorizedError('Invalid Google token');
    }

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      throw new UnauthorizedError('Invalid Google payload');
    }

    const { sub: googleId, email, name } = payload;

    // Check if user exists by googleId
    let user = await UserModel.findByGoogleId(googleId);

    if (!user) {
      // Check if user exists by email but not linked to Google
      user = await UserModel.findByEmail(email);
      if (user) {
        // Link the Google account (for simplicity, we assume this is fine, or throw an error depending on security requirements)
        // Since we didn't add a method to update the user, we'll throw an error telling them to login normally
        if (user.authProvider !== 'google') {
           throw new ConflictError('Email already registered with password. Please log in normally.');
        }
      } else {
        // Create new user (automatically verified for Google)
        user = await UserModel.create({
          email,
          name: name || 'Google User',
          password: null,
          googleId,
          authProvider: 'google',
          isVerified: true,
        });
      }
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
   * Verify an email address via OTP code.
   * @param {{ email: string, code: string }} data
   * @returns {Promise<{ user: User, token: string }>}
   */
  async verifyOtp({ email, code }) {
    const otpRecord = await OtpModel.findByEmail(email);
    if (!otpRecord) {
      throw new UnauthorizedError('Verification code not found or expired');
    }

    if (otpRecord.code !== code) {
      throw new UnauthorizedError('Invalid verification code');
    }

    if (new Date() > otpRecord.expiresAt) {
      throw new UnauthorizedError('Verification code has expired');
    }

    // Mark user as verified
    const user = await UserModel.verify(email);

    // Delete used OTP
    await OtpModel.delete(email);

    // Generate JWT
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
   * Resend verification OTP code to an email.
   * @param {{ email: string }} data
   * @returns {Promise<boolean>}
   */
  async resendOtp({ email }) {
    const user = await UserModel.findByEmail(email);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    if (user.isVerified) {
      throw new ConflictError('Email is already verified');
    }

    // Generate new OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await OtpModel.upsert(email, code, expiresAt);
    await EmailService.sendOtp(email, code);

    return true;
  },

  /**
   * Generate a new API key for a user.
   * @param {string} userId
   * @param {string} [name]
   * @returns {Promise<{ key: string, apiKey: ApiKey }>}
   */
  async createApiKey(userId, name = 'Default', scopes, expiresInDays) {
    // Verify user exists
    const user = await UserModel.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Generate raw key and hash it
    const rawKey = generateApiKey();
    const keyHash = hashApiKey(rawKey);
    const prefix = rawKey.substring(0, 12); // "tfk_" + 8 hex chars

    let expiresAt = null;
    if (expiresInDays) {
      expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);
    }

    const apiKey = await ApiKeyModel.create({
      keyHash,
      prefix,
      name,
      userId,
      scopes,
      expiresAt,
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
