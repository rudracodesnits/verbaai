const OpenAI = require('openai');
const { env } = require('./env');

/**
 * OpenAI client instance.
 * Configured from environment variables.
 */
const openai = new OpenAI({
  apiKey: env.OPENAI_API_KEY,
});

module.exports = { openai };
