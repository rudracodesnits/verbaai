const { openai } = require('../config/openai');
const { env } = require('../config/env');
const MockAIProvider = require('./mock.provider');
const logger = require('../utils/logger');
const { InternalError } = require('../utils/errors');

/**
 * AI Service — Clean abstraction over AI providers.
 *
 * Supports two providers:
 *   - "openai" → Real OpenAI API calls (costs money)
 *   - "mock"   → Heuristic-based responses (free, for dev/demos)
 *
 * Set AI_PROVIDER in .env to switch. Default: "mock"
 */
const AIService = {
  /**
   * Summarize a piece of text.
   * @param {string} text
   * @returns {Promise<{ summary: string, tokensUsed: number }>}
   */
  async summarize(text, options = {}) {
    const systemPrompt = `You are a professional text summarizer. 
Summarize the following text concisely while preserving the key information.
Return ONLY a valid JSON object matching the schema: {"summary": string}.
Do not include any markdown formatting, explanations, or backticks (e.g. \`\`\`json).`;

    const result = await this._callModel(systemPrompt, text, options);
    const parsed = this._parseJSON(result.content);

    return {
      summary: parsed.summary,
      tokensUsed: result.tokensUsed,
    };
  },

  /**
   * Analyze sentiment of text.
   * @param {string} text
   * @returns {Promise<{ sentiment: string, score: number, tokensUsed: number }>}
   */
  async sentiment(text, options = {}) {
    const systemPrompt = `You are a sentiment analysis expert.
Analyze the sentiment of the following text.
Return ONLY a valid JSON object matching the schema: {"sentiment": "positive" | "negative" | "neutral", "score": number between -1 and 1}.
- score: -1 = very negative, 0 = neutral, 1 = very positive
Do not include any markdown formatting, explanations, or backticks (e.g. \`\`\`json).`;

    const result = await this._callModel(systemPrompt, text, options);
    const parsed = this._parseJSON(result.content);

    return {
      sentiment: parsed.sentiment,
      score: parsed.score,
      tokensUsed: result.tokensUsed,
    };
  },

  /**
   * Detect toxicity in text.
   * @param {string} text
   * @returns {Promise<{ toxic: boolean, confidence: number, tokensUsed: number }>}
   */
  async toxicity(text, options = {}) {
    const systemPrompt = `You are a content moderation expert.
Analyze whether the following text contains toxic, harmful, or offensive content.
Return ONLY a valid JSON object matching the schema: {"toxic": boolean, "confidence": number between 0 and 1}.
- confidence: how confident you are in your assessment (0 = not confident, 1 = very confident)
Do not include any markdown formatting, explanations, or backticks (e.g. \`\`\`json).`;

    const result = await this._callModel(systemPrompt, text, options);
    const parsed = this._parseJSON(result.content);

    return {
      toxic: parsed.toxic,
      confidence: parsed.confidence,
      tokensUsed: result.tokensUsed,
    };
  },

  /**
   * Extract keywords from text.
   * @param {string} text
   * @returns {Promise<{ keywords: string[], tokensUsed: number }>}
   */
  async keywords(text, options = {}) {
    const systemPrompt = `You are a keyword extraction expert.
Extract the most important and relevant keywords from the following text.
Return ONLY a valid JSON object matching the schema: {"keywords": string[]}.
Return between 3 and 10 keywords. Order by relevance (most relevant first).
Do not include any markdown formatting, explanations, or backticks (e.g. \`\`\`json).`;

    const result = await this._callModel(systemPrompt, text, options);
    const parsed = this._parseJSON(result.content);

    return {
      keywords: parsed.keywords,
      tokensUsed: result.tokensUsed,
    };
  },

  /**
   * Chat about a selected text context.
   * @param {string} context - The selected text
   * @param {Array<{role: string, content: string}>} messages - Conversation history
   * @returns {Promise<{ reply: string, tokensUsed: number }>}
   */
  async chat(context, messages, options = {}) {
    const systemPrompt = `You are a helpful assistant. The user has selected the following text as context:\n\n"${context}"\n\nAnswer the user's questions based on this context. Return ONLY a valid JSON object matching the schema: {"reply": string}.
Do not include any markdown formatting, explanations, or backticks (e.g. \`\`\`json).`;

    // Format conversation history for _callModel
    const userMessage = messages.map(m => `${m.role}: ${m.content}`).join('\n');

    const result = await this._callModel(systemPrompt, userMessage, options);
    const parsed = this._parseJSON(result.content);

    return {
      reply: parsed.reply,
      tokensUsed: result.tokensUsed,
    };
  },

  // ─── Private Methods ────────────────────────────────

  /**
   * Call the AI model via the configured provider.
   * Switch providers by setting AI_PROVIDER in .env.
   *
   * @param {string} systemPrompt
   * @param {string} userMessage
   * @returns {Promise<{ content: string, tokensUsed: number }>}
   */
  async _callModel(systemPrompt, userMessage, options = {}) {
    if (env.AI_PROVIDER === 'mock') {
      return MockAIProvider.callModel(systemPrompt, userMessage);
    }

    return this._callOpenAI(systemPrompt, userMessage, options);
  },

  /**
   * OpenAI provider implementation.
   * @param {string} systemPrompt
   * @param {string} userMessage
   * @returns {Promise<{ content: string, tokensUsed: number }>}
   */
  async _callOpenAI(systemPrompt, userMessage, options = {}) {
    try {
      const response = await openai.chat.completions.create({
        model: options.model || 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        temperature: options.temperature !== undefined ? options.temperature : 0.3,
        max_tokens: options.maxTokens !== undefined ? options.maxTokens : 1024,
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0]?.message?.content || '';
      const tokensUsed = response.usage?.total_tokens || 0;

      return { content, tokensUsed };
    } catch (error) {
      logger.error('AI service call failed:', error);

      if (error.status === 429) {
        throw new InternalError('AI service rate limited. Please try again later.');
      }
      if (error.status === 401) {
        throw new InternalError('AI service authentication failed. Check API key.');
      }

      throw new InternalError('AI service unavailable. Please try again later.');
    }
  },

  /**
   * Parse JSON from model output.
   * @param {string} content
   * @returns {Object}
   */
  _parseJSON(content) {
    try {
      return JSON.parse(content);
    } catch {
      logger.error('Failed to parse AI response as JSON:', content);
      throw new InternalError('Failed to parse AI response');
    }
  },
};

module.exports = AIService;
