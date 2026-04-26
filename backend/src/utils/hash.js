const crypto = require('crypto');
const bcrypt = require('bcryptjs');

const SALT_ROUNDS = 12;

/**
 * Hash a password with bcrypt.
 * @param {string} password
 * @returns {Promise<string>}
 */
async function hashPassword(password) {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Compare a plaintext password with a bcrypt hash.
 * @param {string} password
 * @param {string} hash
 * @returns {Promise<boolean>}
 */
async function comparePassword(password, hash) {
  return bcrypt.compare(password, hash);
}

/**
 * Generate a random API key.
 * Format: tfk_<32 hex chars>  (total 36 chars)
 * @returns {string}
 */
function generateApiKey() {
  const randomBytes = crypto.randomBytes(32).toString('hex');
  return `tfk_${randomBytes}`;
}

/**
 * SHA-256 hash for API keys.
 * We store hashed keys in the database, never plaintext.
 * @param {string} key
 * @returns {string}
 */
function hashApiKey(key) {
  return crypto.createHash('sha256').update(key).digest('hex');
}

/**
 * SHA-256 hash for cache keys (input text).
 * @param {string} text
 * @returns {string}
 */
function hashText(text) {
  return crypto.createHash('sha256').update(text).digest('hex');
}

module.exports = {
  hashPassword,
  comparePassword,
  generateApiKey,
  hashApiKey,
  hashText,
};
